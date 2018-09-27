module.exports = async function writeToAmqp (conn, exchangeName, routingKey, chunk) {
  const channel = await conn.connect();
  return channel.publish(exchangeName, routingKey, chunk);
};
