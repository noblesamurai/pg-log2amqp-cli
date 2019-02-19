const knex = require('knex')(process.env.DATABASE_URL);
const knexLog = require('knex-log')(knex, { tableName: 'image-search-logs', columnName: 'data' });
const amqp = require('amqplib');
const transferStreamBackpressure = require('transfer-stream-backpressure');
let conn;

async function main () {
  try {
    conn = await amqp.connect(process.env.AMQP_URL);
    const rs = knexLog.createReadStream();
    const check = () => {};
    const options = {};
    const through = transferStreamBackpressure(check, options);
    const write = amqpWrite(/* FIXME... */);
    rs.pipe(through).pipe(write);
    rs.on('error', fail);
  } catch (err) {
    fail(err);
  }
}

main();

function fail (err) {
  console.error('failed', err);
  process.exit(1);
}
