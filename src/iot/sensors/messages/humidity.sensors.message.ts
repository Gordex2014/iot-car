import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IncHumiditySensorDataDto } from '../dtos';
import { IncHumiditySensorTopics } from '../enums';
import { HumiditySensorsService } from '../services';

@Controller()
export class HumiditySensorMessages {
  private readonly _humiditySensorService: HumiditySensorsService;

  constructor(humiditySensorService: HumiditySensorsService) {
    this._humiditySensorService = humiditySensorService;
  }

  /**
   * Receives the humidity data of a sensor and saves it to the cache
   * @param payload is the incoming data transfer object from the iot device.
   */
  @MessagePattern(IncHumiditySensorTopics.HUMIDITY_DATA)
  async receiveHumidityRead(@Payload() payload: IncHumiditySensorDataDto) {
    await this._humiditySensorService.saveHumidityData(payload);
  }
}
