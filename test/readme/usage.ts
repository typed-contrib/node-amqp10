/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10#usage
 */

import * as amqp from "amqp10";
import Policy = amqp.Policy;

// Uses PolicyBase default policy
const client = new amqp.Client();

client.connect('amqp://localhost')
    .then(() => Promise.all([
        client.createReceiver('amq.topic'),
        client.createSender('amq.topic')
    ]))
    .then(([receiver, sender]) => {
        receiver.on('errorReceived', err => { /** check for errors. */ });
        receiver.on('message', message => {
            console.log('Rx message: ', message.body);
        });

        return sender.send({ key: "Value" });
    })
    .catch(err => {
        console.log("error: ", err);
    });

const mergedClient = new amqp.Client(Policy.merge({
  senderLink: {
    callback: Policy.Utils.SenderCallbackPolicies.OnSent
  }
}, Policy.Default));
