const { Writable } = require('stream');
/**
 * @param {Channel} channel - The amqplib channel to publish on.
 * @param {string} exchange - The exchange to publish on.
 * @param {string} routingKey - The routing key to publish on.
 * @param {object} opts
 * @description
 * - opts.amqp - Options passed to amqplib's publish() method.
 * - opts.stream - Options passed to the Writable stream.
 */
module.exports = function (channel, exchange, routingKey, { amqp = {}, stream = {} }) {
  return new Writable(Object.assign(stream, {
    write (chunk, enc, cb) {
      channel.publish(exchange, routingKey, chunk, amqp).then(cb).catch(cb);
    }
  }));
};
