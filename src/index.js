const knex = require('knex')(process.env.DATABASE_URL);
const knexLog = require('knex-log')(knex, { tableName: 'image-search-logs', columnName: 'data' });
const amqp = require('amqplib');
const amqpBackpressure = require('./amqp-backpressure');
let conn;

const amqpBackpressure = ('')

async function main () {
  try {
    conn = await amqp.connect(process.env.AMQP_URL);
    const rs = knexLog.createReadStream();
    rs.pipe(amqpBackpressure).pipe(amqpWrite);
  } catch (err) {
    console.error('catch', err);
  }
}

main();
