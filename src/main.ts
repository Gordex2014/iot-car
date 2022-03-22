import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Server');

  const app = await NestFactory.create(AppModule);

  app.enableCors();
  const configureService: ConfigService = app.get<ConfigService>(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice({
    transport: Transport.MQTT,
    options: {
      subscribeOptions: { qos: 1 },
      url: configureService.get<number>('mqtt.broker.url'),
    },
  });

  const port = configureService.get<number>('port');

  await app.startAllMicroservices();
  await app.listen(port, () => logger.log(`Server running on port ${port}.`));
}
bootstrap();
