const parseConnection = require('knex/lib/util/parse-connection');

// check required env variables and display appropriate error message.
const required = [ 'DATABASE_URL', 'DATABASE_TABLE_NAME', 'AMQP_URL', 'AMQP_SEARCH_QUEUE' ];
const missing = required.filter(env => !process.env[env]);
if (missing.length) {
  console.log(`missing ${missing.join(', ')} environment variables.`);
  process.exit(1);
}

module.exports = {
  db: parseConnection(process.env.DATABASE_URL),
  tableName: process.env.DATABASE_TABLE_NAME,
  logOffset: parseInt(process.env.LOG_OFFSET) || 0,
  amqp: {
    url: process.env.AMQP_URL,
    queueName: process.env.AMQP_SEARCH_QUEUE
  }
};
