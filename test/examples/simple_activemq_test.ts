/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10/blob/master/examples/simple_activemq_test.js
 */

import * as amqp from "amqp10";

const
  uri = 'amqp://some.host',
  msgId = Math.floor(Math.random() * 10000),
  client = new amqp.Client();

client.connect(uri)
  .then(() => {
    return Promise.all([
      client.createReceiver('amq.topic'),
      client.createSender('amq.topic')
    ]);
  })
  .then(([receiver, sender]) => {
    receiver.on('errorReceived', err => { console.log('error receiving: ', err); });

    receiver.on('message', message => {
      console.log('received: ', message.body);

      if (message.annotations)
        console.log('annotations: ', message.annotations);

      if (message.body.dataValue === msgId) {
        client.disconnect().then(() => {
          console.log('received expected message, disconnected.');
          process.exit(0);
        });
      }
    });

    const message = { dataString: "From Node", dataValue: msgId };
    console.log('sending: ', message);

    return sender.send(message).then(state => {
      // this can be used to optionally track the disposition of the sent message
      console.log('state: ', state);
    });
  })
  .catch(e => {
    console.log('connection error: ', e);
  });