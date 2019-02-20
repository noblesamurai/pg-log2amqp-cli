const config = require('./config');
const knex = require('knex')(config.db);
const knexLog = require('knex-log')(knex, { tableName: config.tableName, columnName: 'data' });
const amqp = require('amqplib');
const AmqpWritableStream = require('./amqp-writable-stream');
const progress = require('progress-stream');
const { LogFrame, CompositeLogView, RawLogView } = require('log-frame');
const { ProgressBar } = require('logf-progress');

main();

async function main () {
  try {
    const { count } = await knex(config.tableName).where('id', '>=', config.logOffset).count().first();
    const ps = progress({ objectMode: true, length: parseInt(count), time: 1000 });
    const view = new CompositeLogView();
    const frame = new LogFrame({ hideCursor: true });
    frame.view = view;
    const bar = new ProgressBar();
    const label = new RawLogView();
    view.addChild(bar);
    view.addChild(label);
    ps.on('progress', p => {
      bar.setProgress(p.percentage / 100);
      label.content = ` - ${p.percentage.toFixed(2)}% ${p.length - p.remaining}/${p.length}`;
    });

    // create knex log stream
    const rs = knexLog.createReadStream({
      offset: { id: config.logOffset }, // where to start reading logs from
      batchSize: 16, // knex rows fetched at a time
      highWaterMark: 16 // stream high watermark for backpressure
    });

    // create amqp connection and write stream
    const conn = await amqp.connect(config.amqp.url);
    const ch = await conn.createChannel();
    // just check that the queue exists... will throw if it doesn't. the main logging process
    // should be responsible for making sure it exists.
    await ch.checkQueue(config.amqp.queueName);
    const write = new AmqpWritableStream(ch, config.amqp.queueName);

    // begin...
    rs.pipe(ps).pipe(write).on('error', fail);
    write.on('finish', end);
  } catch (err) {
    fail(err);
  }
}

function fail (err) {
  console.error('failed', err);
  process.exit(1);
}

function end () {
  process.exit(0);
}
