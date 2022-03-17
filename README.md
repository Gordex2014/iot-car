# General purpose authentication service

This service is intended to be used by other services to authenticate users.

## Setup

    $ yarn

    Turn on docker and the first time run:

    $ yarn db:dev:up

    Then run (You are free to choose the name of the migration):

    $ npx prisma migrate dev

    To seed the database with a user with admin privileges (admin:adminpw):

    $ npx prisma db seed

## Usage

Once you completed the setup, you can use the following commands to start the service:

    If you didn't change the schema.prisma file, you can use the following commands to start the service:

    $ yarn db:dev:start

    If you changed the schema.prisma file, you can use the following commands to start the service:

    $ yarn db:dev:restart