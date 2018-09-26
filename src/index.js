const knex = require('knex')(process.env.DATABASE_URL);
const knexLog = require('knex-log')(knex, { tableName: 'image-search-logs', columnName: 'data' });
const { Writable } = require('stream');
const amqp = require('amqplib');

async function checkAMQP (conn, queue) {
  const channel = await conn.createChannel();
  channel.on('error', console.error);
  const result = await (channel.checkQueue(queue));
  console.log('result', result);
  return result;
}

let conn;
const writeToAMQP = new Writable({
  write (chunk, encoding, callback) {
    console.log('chunk', typeof chunk);
    checkAMQP(conn, 'test').then(result => {
      console.log('checkAMQP result', result);
      callback();
    }).catch((err) => {
      console.error('handling error', err);
      callback();
    });
  },
  objectMode: true
});

async function main () {
  try {
    conn = await amqp.connect(process.env.AMQP_URL);
    // const rs = knexLog.createReadStream();
    // rs.on('error', console.error);
    // rs.pipe(writeToAMQP).on('error', console.error);
    const result = await checkAMQP(conn, 'test');
    console.log({result});
  } catch (err) {
    console.error('catch', err);
  }
}

main();
