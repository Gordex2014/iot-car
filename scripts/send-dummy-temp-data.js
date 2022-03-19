/* eslint-disable @typescript-eslint/no-var-requires */
const cron = require('node-cron');
const { exec } = require('child_process');

const argv = require('./config/yargs');

const host = argv.h;
const topic = argv.t;
const sensorId = argv.s;

console.log(
  `Sending dummy temperature data to the topic ${topic} every two seconds`,
);
console.log('Press Ctrl+C to stop');

cron.schedule('*/2 * * * * *', () => {
  const randomTemp = Math.floor(Math.random() * (25 - 10 + 1)) + 10;
  exec(
    `mosquitto_pub -h ${host} -p 1883 -t ${topic} -m '{"temperature": "${randomTemp}","sensorId":"${sensorId}"}' -q 1 -d`,
  );
});
