# Typed node-amqp10 [![Build Status](https://travis-ci.org/typed-contrib/node-amqp10.svg?branch=master)](https://travis-ci.org/typed-contrib/node-amqp10)

Type definitions for [node-amqp10](https://github.com/noodlefrenzy/node-amqp10).

## Installation

Installation can be done using [typings](https://github.com/typings/typings).

From the registry:
```bash
$ typings install amqp10 --save
```

From the source:
```bash
$ typings install github:typed-contrib/node-amqp10 --save
```

`node-amqp10` module works in `node.js` environment and requires `Promise` typings.
So you also have to install `node.js` typings.

```bash
$ typings install dt~node --global --save
```

If you do not target `ES2015` in your TypeScript configuration, install `es2015-promise` typings.

```bash
$ typings install env~es2015-promise --global --save
```

## Contributing

Contributions are welcome !

```bash
# Installation
# Fork this repo (https://github.com/typed-contrib/node-amqp10)
# Clone the fork (E.g. `https://github.com/<your_username>/node-amqp10.git`)
cd node-amqp10

# Install modules and dependencies
npm install

# Test typings over node-amqp10 samples and tests
npm test
```

Some resources to help writing Typescript type definitions:
 * [Writing Declaration Files](http://www.typescriptlang.org/docs/handbook/writing-declaration-files.html)
 * [typings examples](https://github.com/typings/typings/blob/master/docs/examples.md)

## Tests

This type definitions are tested using source `node-amqp10` samples.
 * [JavaScript](https://github.com/noodlefrenzy/node-amqp10)
 * [TypeScript](https://github.com/typed-contrib/node-amqp10/tree/master/test)

## License

MIT
