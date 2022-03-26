import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IncTemperatureSensorActivatedDto,
  IncTemperatureSensorDataDto,
  IncTemperatureSensorDeactivateDto,
} from '../dtos';
import { TemperatureSensorTopics } from '../enums';
import { TemperatureSensorsService } from '../services';

@Injectable()
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

  /**
   * Receives the information that a sensor is activated and saves it to the cache
   * @param payload is the incoming data transfer object from the iot device.
   */
  @MessagePattern(TemperatureSensorTopics.TEMPERATURE_ACTIVE)
  async activateTemperatureSensor(
    @Payload() payload: IncTemperatureSensorActivatedDto,
  ) {
    // await this._temperatureSensorService.activateTemperatureSensor(payload);
    console.log(payload);
  }

  /**
   * Receives the information that a sensor is deactivated and removes it from the cache
   * @param payload is the incoming data transfer object from the iot device.
   */
  @MessagePattern(TemperatureSensorTopics.TEMPERATURE_ACTIVE)
  async deactivateTemperatureSensor(
    @Payload() payload: IncTemperatureSensorDeactivateDto,
  ) {
    // await this._temperatureSensorService.activateTemperatureSensor(payload);
    console.log(payload);
  }
}
