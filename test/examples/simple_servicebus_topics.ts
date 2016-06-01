/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10/blob/master/examples/simple_servicebus_topics.js
 */

//================================
// Simple ServiceBus Topic test - takes in a JSON settings file
// containing settings for connecting to the Topic:
// - protocol: should never be set, defaults to amqps
// - SASKeyName: name of your SAS key which should allow send/receive
// - SASKey: actual SAS key value
// - serviceBusHost: name of the host without suffix (e.g. https://foobar-ns.servicebus.windows.net/foobart => foobar-ns)
// - topicName: name of the topic (e.g. https://foobar-ns.servicebus.windows.net/foobart => foobart)
// - subscriptionName: name of the subscription for the topic (e.g. https://foobar-ns.servicebus.windows.net/foobart/Subscriptions/foobars => foobars)
//
// Will set up a receiver, then send a message and exit when that message is received.
//================================

import * as amqp from "amqp10";

const
    settingsFile = process.argv[2],
    settings = settingsFile ?
        require('./' + settingsFile) :
        {
            serviceBusHost: process.env.ServiceBusNamespace,
            topicName: process.env.topicName,
            subscriptionName: process.env.ServiceBusTopicSubscriptionName,
            SASKeyName: process.env.EventHubKeyName,
            SASKey: process.env.EventHubKey
        };

if (!settings.serviceBusHost || !settings.topicName || !settings.subscriptionName || !settings.SASKeyName || !settings.SASKey) {
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
    topicName = settings.topicName,
    subscriptionName = settings.subscriptionName,

    uri = protocol + '://' + encodeURIComponent(sasName) + ':' + encodeURIComponent(sasKey) + '@' + serviceBusHost,

    msgVal = Math.floor(Math.random() * 1000000),

    client = new amqp.Client(amqp.Policy.ServiceBusTopic);

client.connect(uri)
    .then(() => Promise.all([
        client.createSender(topicName),
        client.createReceiver(topicName + '/Subscriptions/' + subscriptionName)
    ]))
    .then(([sender, receiver]) => {
        // error handling
        sender.on('errorReceived', tx_err => { console.warn('===> TX ERROR: ', tx_err); });
        receiver.on('errorReceived', rx_err => { console.warn('===> RX ERROR: ', rx_err); });

        // message event handler
        receiver.on('message', message => {
            console.log('received: ', message);

            if (message.body.DataValue === msgVal) {
                client.disconnect().then(() => {
                    console.log('disconnected, when we saw the value we inserted.');
                    process.exit(0);
                });
            }
        });

        // send test message
        return sender.send({ DataString: 'from node', DataValue: msgVal }).then(state => {
            // this can be used to optionally track the disposition of the sent message
            console.log('state: ', state);
        });
    })
    .catch(e => {
        console.warn('connection error: ', e);
    });
