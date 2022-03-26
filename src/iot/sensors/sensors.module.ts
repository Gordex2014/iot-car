import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TemperatureSensorsController } from './controllers';
import { SensorsService, TemperatureSensorsService } from './services';
import { SensorsMessage, TemperatureSensorMessages } from './messages';
import { TemperatureSensorsGateway } from './gateways';

const MQTT_CLIENT_NAME = 'IOT_SENSORS_MODULE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: MQTT_CLIENT_NAME,
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            subscribeOptions: { qos: 1 },
            url: configService.get<string>('mqtt.broker.url'),
          },
        }),
      },
    ]),
  ],
  controllers: [
    SensorsMessage,
    TemperatureSensorMessages,
    TemperatureSensorsController,
  ],
  providers: [
    SensorsService,
    TemperatureSensorsGateway,
    TemperatureSensorsService,
  ],
})
export class SensorsModule {}
