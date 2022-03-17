# General purpose authentication service

This service is intended to be used by other services to authenticate users.

## Installation

    $ yarn

    Turn on docker and the first time run:

    $ yarn db:dev:restart

    Then run:

    $ yarn db:dev:start

    To seed the database with a user with admin privileges (admin/admin):

    $ npx prisma db seed