import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IncTemperatureSensorDataDto } from '../dtos';
import { TemperatureSensorTopics } from '../enums';
import { TemperatureSensorsService } from '../services';

@Controller()
export class TemperatureSensorMessages {
  private readonly _temperatureSensorService: TemperatureSensorsService;

  constructor(temperatureSensorService: TemperatureSensorsService) {
    this._temperatureSensorService = temperatureSensorService;
  }

  /**
   * Receives the temperature data of a sensor and saves it to the cache
   * @param payload is the incoming data transfer object from the iot device.
   */
  @MessagePattern(TemperatureSensorTopics.TEMPERATURE_DATA)
  async receiveTemperatureRead(
    @Payload() payload: IncTemperatureSensorDataDto,
  ) {
    await this._temperatureSensorService.saveTemperatureData(payload);
  }
}
