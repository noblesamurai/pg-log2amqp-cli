const config = require('./config');
const knex = require('knex')(config.db);
const knexLog = require('knex-log')(knex, { tableName: config.tableName, columnName: 'data' });
const amqp = require('amqplib');
const AmqpWritableStream = require('./amqp-writable-stream');

main();

async function main () {
  try {
    // create knex log stream
    const rs = knexLog.createReadStream({ offset: { id: config.logOffset } });

    // create amqp connection and write stream
    const conn = await amqp.connect(config.amqp.url);
    const ch = await conn.createChannel();
    // just check that the queue exists... will throw if it doesn't. the main logging process
    // should be responsible for making sure it exists.
    await ch.checkQueue(config.amqp.queueName);
    const write = new AmqpWritableStream(ch, config.amqp.queueName);

    // begin...
    rs.pipe(write).on('error', fail);
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
