import { Controller, Get, Logger, Param, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../../../auth/decorators';
import { JwtGuard } from '../../../auth/guards';
import { OutHumiditySensorsCachedDataDto } from '../dtos';
import { HumiditySensorsService } from '../services';

@Controller('api/v1/sensors/humidity')
export class HumiditySensorsController {
  private readonly _humiditySensorService: HumiditySensorsService;
  private readonly _logger = new Logger(HumiditySensorsController.name);

  constructor(humiditySensorService: HumiditySensorsService) {
    this._humiditySensorService = humiditySensorService;
  }

  @Get('cache/:sensorId')
  @UseGuards(JwtGuard)
  async getHumidityFromCache(
    @Param('sensorId') sensorId: string,
    @GetUser() user: User,
  ) {
    const humidityData = await this._humiditySensorService.getHumidityFromCache(
      sensorId,
    );

    this._logger.log(
      `User ${user.id} requested cached humidity data of sensor ${sensorId}`,
    );
    return {
      data: humidityData,
    };
  }

  @Get('db/:sensorId')
  @UseGuards(JwtGuard)
  async getHumidityFromDb(
    @Param('sensorId') sensorId: string,
    @GetUser() user: User,
  ): Promise<OutHumiditySensorsCachedDataDto> {
    const humidityData =
      await this._humiditySensorService.getHumiditiesFromDatabase(sensorId);

    this._logger.log(
      `User ${user.id} requested persisted humidity data of sensor ${sensorId}`,
    );
    return {
      data: humidityData,
    };
  }
}
