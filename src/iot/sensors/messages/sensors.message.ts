import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IncSensorConnectionDto } from '../dtos';
import { SensorTopics } from '../enums';
import { SensorsService } from '../services';

@Controller()
export class SensorsMessage {
  private readonly _sensorService: SensorsService;

  constructor(sensorService: SensorsService) {
    this._sensorService = sensorService;
  }

  /**
   * Receives the information that a sensor is activated or deactivated and saves it
   * to the cache
   * @param dto is the incoming data transfer object from the iot device.
   */
  @MessagePattern(SensorTopics.CONNECTION)
  async activateTemperatureSensor(@Payload() dto: IncSensorConnectionDto) {
    if (dto.activated) {
      await this._sensorService.activateSensor(dto.sensorId);
    } else {
      await this._sensorService.deactivateSensor(dto.sensorId);
    }
  }
}
