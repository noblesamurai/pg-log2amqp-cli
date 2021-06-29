# pg-log2amqp-cli

## Purpose
- Add [knex-log](https://github.com/noblesamurai/knex-log/) messages onto an AMQP queue to be processed.

## Installation

This module is installed via npm:

``` bash
npm install pg-log2amqp-cli
```

## Usage

```sh
DATABASE_URL=postgres://... \
  DATABASE_TABLE_NAME=logs \
  AMQP_URL=amqp://... \
  AMQP_SEARCH_QUEUE=logs \
  npm start
```

This will queue everything from the very beginning. If you only want later results you can also
set an id offset with:

```sh
LOG_OFFSET=1337
```

## Backpressure

Things to be aware of...
- RabbitMQ has it's own backpressure. @see [RabbitMQ Flow Control](https://www.rabbitmq.com/flow-control.html).
- `amqplib` also implement a kind of writable stream like backpressure. @see [amqplib Flow Control](http://www.squaremobius.net/amqp.node/channel_api.html#flowcontrol).
- `knex-log` streams use [pg-query-stream](https://github.com/brianc/node-pg-query-stream)s which does manage backpressure but there are 2 different
  configuration variables you might need to know about. `highWaterMark` is passed through to the underlying stream object to set it's backpressure
  value. `batchSize` however determines how many rows come back from postgres at a time (and how many get pushed onto the stream). This means that
  if the `highWaterMark` is low and the `batchSize` is high, the number of items in the queue will still be high.

How we use these things...
- We currently create our `knex-log` streams with `{ batchSize: 16, highWaterMark: 16 }` since log entries can be quite large (so we should only
  have up to 35 entries max waiting in the knex log readable queue (usually 16 from experience since it drains all before fetching more).
- We pass that into an `AmqpWritableStream` which publishes to the queue. Each write returns the (mock write stream) results of `sendToQueue()`
  which will apply backpressure and stop writing if `false`. We also re-emit `drain` events from the AMQP channel to our stream to continue again
  once we are able to.
- From the AMQP side we are just relying on their build in flow control which will restrict the incomming bandwidth, which should slow our write
  stream and knex log streams. I have done some basic testing locally and this does appear to be ok.

## License

The BSD License

Copyright (c) 2018, Tim Allen

All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.

* Neither the name of the Tim Allen nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

