/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10/blob/master/examples/simple_eventhub_test.js
 */

//================================
// Simple EventHub test - takes in a JSON settings file
// containing settings for connecting to the Hub:
// - protocol: should never be set, defaults to amqps
// - SASKeyName: name of your SAS key which should allow send/receive
// - SASKey: actual SAS key value
// - serviceBusHost: name of the host without suffix (e.g. https://foobar-ns.servicebus.windows.net/foobar-hub => foobar-ns)
// - eventHubName: name of the hub (e.g. https://foobar-ns.servicebus.windows.net/foobar-hub => foobar-hub)
// - partitions: number of partitions (see node-sbus-amqp10 for a wrapper client that will figure this out for you and connect appropriately)
//
// By default, will set up a receiver on each partition, then send a message and exit when that message is received.
// Passing in a final argument of (send|receive) causes it to only execute one branch of that flow.
//================================

import * as amqp from "amqp10";

// Set the offset for the EventHub - this is where it should start receiving from, and is typically different for each partition
// Here, I'm setting a global offset, just to show you how it's done. See node-sbus-amqp10 for a wrapper library that will
// take care of this for you.
let filterOffset: number; // example filter offset value might be: 43350;
let filterOption; // todo:: need a x-opt-offset per partition.
if (filterOffset) {
    filterOption = {
        attach: {
            source: {
                filter: {
                    'apache.org:selector-filter:string': amqp.translator([
                        'described',
                        ['symbol', 'apache.org:selector-filter:string'],
                        ['string', "amqp.annotation.x-opt-offset > '" + filterOffset + "'"]
                    ])
                }
            }
        }
    };
}

const
    settingsFile = process.argv[2],
    settings = settingsFile ?
        require('./' + settingsFile) :
        {
            serviceBusHost: process.env.ServiceBusNamespace,
            eventHubName: process.env.EventHubName,
            partitions: process.env.EventHubPartitionCount,
            SASKeyName: process.env.EventHubKeyName,
            SASKey: process.env.EventHubKey
        };

if (!settings.serviceBusHost || !settings.eventHubName || !settings.SASKeyName || !settings.SASKey || !settings.partitions) {
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
    eventHubName = settings.eventHubName,
    numPartitions = settings.partitions,

    uri = protocol + '://' + encodeURIComponent(sasName) + ':' + encodeURIComponent(sasKey) + '@' + serviceBusHost,
    sendAddr = eventHubName,
    recvAddr = eventHubName + '/ConsumerGroups/$default/Partitions/',

    msgVal = Math.floor(Math.random() * 1000000),

    client = new amqp.Client(amqp.Policy.EventHub);

client.connect(uri)
    .then(() => Promise.all(
        range(0, numPartitions).map(idx => createPartitionReceiver(idx, recvAddr + idx, filterOption))
    ))
    .then(() => client.createSender(sendAddr))
    .then(sender => {
        sender.on('errorReceived', function (tx_err) { console.warn('===> TX ERROR: ', tx_err); });

        // {'x-opt-partition-key': 'pk' + msgVal}
        const message = { DataString: 'From Node', DataValue: msgVal };
        const options = { annotations: { 'x-opt-partition-key': 'pk' + msgVal } };

        return sender.send(message, options).then(state => {
            // this can be used to optionally track the disposition of the sent message
            console.log('state: ', state);
        });
    })
    .catch(e => {
        console.warn('connection error: ', e);
    });

function createPartitionReceiver(curIdx: number, curRcvAddr: string, filterOption: amqp.Policy.Options.ReceiverLink) {
    return client.createReceiver(curRcvAddr, filterOption)
        .then(receiver => {
            receiver.on('message', messageHandler.bind(null, curIdx));
            receiver.on('errorReceived', errorHandler.bind(null, curIdx));
        });
};

function messageHandler(myIdx: number, msg: amqp.Message) {
    console.log('received(' + myIdx + '): ', msg.body);

    if (msg.annotations)
        console.log('annotations: ', msg.annotations);

    if (msg.body.DataValue === msgVal) {
        client.disconnect().then(() => {
            console.log('disconnected, when we saw the value we inserted.');
            process.exit(0);
        });
    }
}

function errorHandler(myIdx: number, rx_err: amqp.Errors.BaseError) {
    console.warn('==> RX ERROR: ', rx_err);
}

function range(begin, end) {
    return Array.apply(null, new Array(end - begin)).map(function (_, i) { return i + begin; });
}
