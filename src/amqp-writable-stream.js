const config = require('./config');
const { Writable } = require('stream');
const stringify = require('json-stringify-safe');

/**
 * @see http://www.squaremobius.net/amqp.node/channel_api.html#flowcontrol
 */
module.exports = class AmqpWritableStream extends Writable {
  constructor (channel, queueName, opts = {}) {
    super(Object.assign(opts, { objectMode: true }));
    this.channel = channel;
    this.queueName = queueName;
    channel.on('drain', () => this.emit('drain'));
  }
  write (chunk, encoding, callback) {
    if (typeof chunk !== 'object') return true; // chunk should be an object, return true to keep going.
    if (config.requiredLogKey) { // check to see if the required log key is in this chunk
      const logs = Array.isArray(chunk.value) ? chunk.value : chunk.value.logs;
      if (!logs.some(log => Object.keys(log).includes(config.requiredLogKey))) return true;
    }
    return this.channel.sendToQueue(this.queueName, Buffer.from(stringify(chunk)), callback);
  }
};
