const knex = require('knex')(process.env.DATABASE_URL);
const knexLog = require('knex-log')(knex, { tableName: 'image-search-logs', columnName: 'data' });

// TODO: update knex-log to allow the setting of highWaterMark and batchSize
// -- highWaterMark is the watermark of the underlying readable stream
// -- batchSize is the number of items pg-query-stream pushes on at a time (defaults to 100)
// This means that if you have a highWaterMark value less than 100 you probably want to
// adjust the batchSize as well... (ie. with highWaterMark of 16 and batchSize of 100, the
// readable stream will hold between 100 and 115 items assuming there are still more entries
// to be returned from the knex query.
//
// Note: a highWaterMark of 16 with a batchSize of 100 is going to be the default behaviour
// @see https://nodejs.org/api/stream.html#stream_new_stream_readable_options for readable
// stream options (specifically the default values).

// const amqp = require('amqplib');
let conn;

// TODO: cs-media-search-logger-staging and cs-image-crawl-staging use differend DBs...
// they should probably both use the cs-media-search-logger-staging one like we do in live.
//
// DATABASE_URL=postgres://u5e2ab49ouu1tv:p@ec2-35-153-215-128.compute-1.amazonaws.com:5432/d2sl32lqah04e2
// DATABASE_TABLE_NAME=image-search-logs

const { Writable } = require('stream');

// this only makes sure we don't write too much at once... it doesn't stop us from overloading the rabbitmq server... :(
class AmqpWritableStream extends Writable {
  constructor (channel, queue = 'staging.cs-media-crawl.search', opts = {}) {
    super(Object.assign(opts, { objectMode: true }));
    this.channel = channel;
    this.queue = queue;
    channel.on('drain', () => this.emit('drain'));
  }
  write (chunk, encoding, callback) {
    return this.channel.sendToQueue(this.queue, chunk);
  }
}

// better approach?
async function better () {
  const conn = await amqp.connect(process.env.AMQP_URL);
  const ch = await conn.createConfirmChannel();
  ch.prefetch(10); // this will still ack and continue once log has been confirmed written to rabbitmq queue. won't stop queues balooning.
  ch.sendToQueue(this.queue, chunk);
}

// we can get the current message and consumer counts with...
const { messageCount, consumerCount } = await ch.checkQueue(queue); // will die if queue doesn't exist (will not create like assertQueue and doesn't need options).

const write = new AmqpWritableStream();

async function main () {
  try {
    // conn = await amqp.connect(process.env.AMQP_URL);
    const rs = knexLog.createReadStream(); // <-- this is ok... it has backpressure... kind of
      // (so long as we have at least 100 - 115 log records worth of memeory).
    rs.pipe(write).on('error', fail);
  } catch (err) {
    fail(err);
  }
}

main();

function fail (err) {
  console.error('failed', err);
  process.exit(1);
}
