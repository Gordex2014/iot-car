import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from '@prisma/client';
import { GetUser } from '../../../auth/decorators';
import { JwtGuard } from '../../../auth/guards';
import { OutSensorsCachedDataDto, OutTemperatureSensorDto } from '../dtos';
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
  async receiveTemperatureRead(@Payload() payload: OutTemperatureSensorDto) {
    await this._temperatureSensorService.saveTemperatureData(payload);
  }

  @Get('cache/:sensorId')
  @UseGuards(JwtGuard)
  async getTemperatureFromCache(
    @Param('sensorId') sensorId: string,
    @GetUser() user: User,
  ) {
    const temperatureData =
      await this._temperatureSensorService.getTemperatureFromCache(sensorId);

    this._logger.log(
      `User ${user.id} requested cached temperature data of sensor ${sensorId}`,
    );
    return {
      data: temperatureData,
    };
  }

  @Get('db/:sensorId')
  @UseGuards(JwtGuard)
  async getTemperatureFromDb(
    @Param('sensorId') sensorId: string,
    @GetUser() user: User,
  ): Promise<OutSensorsCachedDataDto> {
    const temperatureData =
      await this._temperatureSensorService.getTemperatureFromDatabase(sensorId);

    this._logger.log(
      `User ${user.id} requested persisted temperature data of sensor ${sensorId}`,
    );
    return {
      data: temperatureData,
    };
  }
}
