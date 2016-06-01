/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10/blob/master/examples/simple_servicebus_queues.js
 */

//================================
// Simple ServiceBus Queue test - takes in a JSON settings file
// containing settings for connecting to the Queue:
// - protocol: should never be set, defaults to amqps
// - SASKeyName: name of your SAS key which should allow send/receive
// - SASKey: actual SAS key value
// - serviceBusHost: name of the host without suffix (e.g. https://foobar-ns.servicebus.windows.net/foobarq => foobar-ns)
// - queueName: name of the queue (e.g. https://foobar-ns.servicebus.windows.net/foobarq => foobarq)
//
// By default, will set up a receiver, then send a message and exit when that message is received.
// Passing in a final argument of (send|receive) causes it to only execute one branch of that flow.
//================================

import * as amqp from "amqp10";

const
    settingsFile = process.argv[2],
    settings = settingsFile ?
        require('./' + settingsFile) :
        {
            serviceBusHost: process.env.ServiceBusNamespace,
            queueName: process.env.queueName,
            SASKeyName: process.env.EventHubKeyName,
            SASKey: process.env.EventHubKey
        };

if (!settings.serviceBusHost || !settings.queueName || !settings.SASKeyName || !settings.SASKey) {
    console.warn('Must provide either settings json file or appropriate environment variables.');
    process.exit(1);
}

const
    protocol = settings.protocol || 'amqps',
    serviceBusHost = settings.serviceBusHost.indexOf(".") !== -1 ?
        settings.serviceBusHost :
        settings.serviceBusHost + '.servicebus.windows.net',

    sasName = settings.SASKeyName,
    sasKey = settings.SASKey,
    queueName = settings.queueName,

    uri = protocol + '://' + encodeURIComponent(sasName) + ':' + encodeURIComponent(sasKey) + '@' + serviceBusHost,

    msgVal = Math.floor(Math.random() * 1000000),

    client = new amqp.Client(amqp.Policy.ServiceBusQueue);

client.connect(uri)
    .then(() => Promise.all([
        client.createSender(queueName),
        client.createReceiver(queueName)
    ]))
    .then(([sender, receiver]) => {
        sender.on('errorReceived', tx_err => { console.warn('===> TX ERROR: ', tx_err); });
        receiver.on('errorReceived', rx_err => { console.warn('===> RX ERROR: ', rx_err); });

        receiver.on('message', message => {
            console.log('received: ', message.body);

            if (message.annotations)
                console.log('annotations: ', message.annotations);

            if (message.body.DataValue === msgVal) {
                client.disconnect().then(() => {
                    console.log('disconnected, when we saw the value we inserted.');
                    process.exit(0);
                });
            }
        });

        return sender.send({ DataString: 'From Node', DataValue: msgVal }).then(state => {
            // this can be used to optionally track the disposition of the sent message
            console.log('state: ', state);
        });
    })
    .catch(e => {
        console.warn('connection error: ', e);
    });