import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from '@prisma/client';
import { GetUser } from '../../../auth/decorators';
import { JwtGuard } from '../../../auth/guards';
import { TemperatureSensorDto } from '../dtos';
import { SensorTopics } from '../enums';
import { TemperatureSensorsService } from '../services';

@Controller('api/v1/sensors/temperature')
export class TemperatureSensorsController {
  private readonly _temperatureSensorService: TemperatureSensorsService;
  private readonly _logger = new Logger(TemperatureSensorsController.name);

  constructor(temperatureSensorService: TemperatureSensorsService) {
    this._temperatureSensorService = temperatureSensorService;
  }

  @MessagePattern(SensorTopics.TEMPERATURE)
  async receiveTemperatureRead(@Payload() payload: TemperatureSensorDto) {
    await this._temperatureSensorService.saveTemperatureData(payload);
  }

  @Get(':sensorId')
  @UseGuards(JwtGuard)
  async getTemperatureFromCache(
    @Param('sensorId') sensorId: string,
    @GetUser() user: User,
  ) {
    const tempData =
      await this._temperatureSensorService.getTemperatureFromCache(sensorId);

    this._logger.log(
      `User ${user.id} requested temperature data of sensor ${sensorId}`,
    );
    return {
      data: tempData,
    };
  }
}
