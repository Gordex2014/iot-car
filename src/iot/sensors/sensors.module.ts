import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  TemperatureSensorsController,
  HumiditySensorsController,
} from './controllers';
import {
  HumiditySensorsService,
  SensorsService,
  TemperatureSensorsService,
} from './services';
import {
  HumiditySensorMessages,
  SensorsMessage,
  TemperatureSensorMessages,
} from './messages';
import {
  TemperatureSensorsGateway,
  SensorsGateway,
  HumiditySensorsGateway,
} from './gateways';

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
    HumiditySensorMessages,
    HumiditySensorsController,
    SensorsMessage,
    TemperatureSensorMessages,
    TemperatureSensorsController,
  ],
  providers: [
    HumiditySensorsGateway,
    HumiditySensorsService,
    SensorsGateway,
    SensorsService,
    TemperatureSensorsGateway,
    TemperatureSensorsService,
  ],
})
export class SensorsModule {}
