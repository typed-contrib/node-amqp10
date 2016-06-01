/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10#flow-control-and-message-dispositions
 */

import * as amqp from "amqp10";
import Policy = amqp.Policy;

// Uses PolicyBase default policy
const client = new amqp.Client(Policy.Utils.RenewOnSettle(1, 1, Policy.ServiceBusQueue));

client.connect('amqp://localhost')
    .then(() => client.createReceiver('amq.topic'))
    .then(receiver => {
        receiver.on('errorReceived', err => { /** check for errors. */ });

        receiver.on('message', message => {
            console.log('Rx message: ', message.body);

            switch (message.body) {
                case "accepted":
                    receiver.accept(message);
                    break;
                    
                case "rejected":
                    receiver.reject(message, "This is an error");
                    break;
                    
                case "modify":
                    receiver.modify(message, { undeliverableHere: true });
                    break;
                    
                case "release":
                    receiver.release(message);
                    break;
            }
        });
    });
