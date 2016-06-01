/**
 * EXAMPLES FROM: https://github.com/noodlefrenzy/node-amqp10/blob/master/examples/eventhub_management_request.js
 */

//================================
// EventHub Management test - takes in a JSON settings file
// containing settings for connecting to the Hub:
// - protocol: should never be set, defaults to amqps
// - SASKeyName: name of your SAS key which should allow send/receive
// - SASKey: actual SAS key value
// - serviceBusHost: name of the host without suffix (e.g. https://foobar-ns.servicebus.windows.net/foobar-hub => foobar-ns)
// - eventHubName: name of the hub (e.g. https://foobar-ns.servicebus.windows.net/foobar-hub => foobar-hub)
//
// Connects to the $management hub of the service bus, and sends a request to read properties for the given event hub
// Dumps out the number of partitions, their IDs, and then quits.
//================================

import * as amqp from "amqp10";

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

  uri = protocol + '://' + encodeURIComponent(sasName) + ':' + encodeURIComponent(sasKey) + '@' + serviceBusHost,
  managementEndpoint = '$management',

  rxName = 'client-temp-node',
  rxOptions = { attach: { target: { address: rxName } } },

  client = new amqp.Client(amqp.Policy.EventHub);

client.connect(uri)
  .then(() => {
    return Promise.all([
      client.createReceiver(managementEndpoint, rxOptions),
      client.createSender(managementEndpoint)
    ]);
  })
  .then(([receiver, sender]) => {
    sender.on('errorReceived', tx_err => { console.warn('===> TX ERROR: ', tx_err); });
    receiver.on('errorReceived', rx_err => { console.warn('===> RX ERROR: ', rx_err); });

    receiver.on('message', msg => {
      console.log('Message received: ');
      console.log('Number of partitions: ' + msg.body.partition_count);
      console.log('Partition IDs: ' + msg.body.partition_ids);

      client.disconnect().then(() => {
        console.log('=== Disconnected ===');
        process.exit(0);
      });
    });

    const request = {
      body: 'stub',
      properties: { messageId: 'request1', replyTo: rxName },
      applicationProperties: { operation: 'READ', name: eventHubName, type: 'com.microsoft:eventhub' }
    };

    return sender.send(request).then(state => {
      // this can be used to optionally track the disposition of the sent message
      console.log('State: ', state);
    });
  })
  .catch(e => {
    console.warn('connection error: ', e);
  });