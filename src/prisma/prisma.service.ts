import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService is a wrapper around the PrismaClient that handles the
 * connection to the database using the PrismaClient and the configuration
 * service.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly _logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('db.url'),
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    this._logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this._logger.log('Database disconnected');
  }
}
