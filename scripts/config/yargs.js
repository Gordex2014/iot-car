/* eslint-disable @typescript-eslint/no-var-requires */
const argv = require('yargs')
  .option('h', {
    alias: 'host',
    type: 'string',
    demandOption: false,
    describe: 'Host of the mqtt broker',
  })
  .option('t', {
    alias: 'topic',
    type: 'string',
    demandOption: false,
    describe: 'Topic to send data to',
  })
  .check((argv, options) => {
    if (!argv.t) {
      throw 'Topic is required';
    }
    if (!argv.h) {
      throw 'Broker host is required';
    }
    return true;
  }).argv;

module.exports = argv;
