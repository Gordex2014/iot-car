# Iot Car

This is the server to manage a remote car with multiple sensor reads.

## Setup

    If you don't have yarn installed, run the following command:

    $ npm i -g yarn

    Install the dependencies:

    $ yarn

    Turn on docker and the first time run:

    $ yarn db:dev:up

    Then run (You are free to choose the name of the migration):

    $ npx prisma migrate dev

    Then generate the client artifacts:

    $ npx prisma generate

    To seed the database with a user with admin privileges (admin:adminpw):

    $ npx prisma db seed

    Start the services in dev mode:

    $ yarn start:dev

    In other terminal:

    $ yarn start:dev:mqtt

## Usage

Once you completed the setup, you can use the following commands to start the service:

    If you didn't change the schema.prisma file, you can use the following commands to start the service:

    $ yarn db:dev:start

    If you changed the schema.prisma file, you can use the following commands to start the service:

    $ yarn db:dev:restart

If you want to simulate a dummy temperature sensor, you can use the following commands:

    $ node scripts/send-dummy-temp-data.js -h your-mqtt-broker-ip -t your-topic -s your-sensor-id

Please make sure to install mosquitto and mosquitto_clients before running the script.

This will save dummy information to the database every 30 seconds.