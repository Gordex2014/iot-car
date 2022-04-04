import {
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HumidityData } from '@prisma/client';
import { Cache } from 'cache-manager';
import { CronExpressionsEnum } from '../../../common/enums/cron.enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { IncHumiditySensorDataDto } from '../dtos';
import { HumidityOutgoingEvents } from '../enums';
import { HumiditySensorsGateway } from '../gateways';
import { HumiditySensorCacheRegistry } from '../types';
import { SensorsService } from './sensors.service';

@Injectable()
export class HumiditySensorsService {
  private readonly _cacheManager: Cache;
  private readonly _prismaService: PrismaService;
  private readonly _sensorsService: SensorsService;
  private readonly _humiditySensorsGateway: HumiditySensorsGateway;
  private readonly _logger = new Logger(HumiditySensorsService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    prismaService: PrismaService,
    sensorsService: SensorsService,
    @Inject(forwardRef(() => HumiditySensorsGateway))
    humiditySensorsGateway: HumiditySensorsGateway,
  ) {
    this._cacheManager = cacheManager;
    this._prismaService = prismaService;
    this._sensorsService = sensorsService;
    this._humiditySensorsGateway = humiditySensorsGateway;
  }

  MAX_HUMIDITY_CACHE_SIZE = 30;

  /**
   * Adds a humidity to the cache for the given sensorId, adds the
   * humidity at the beginning of the array, the data of a specific
   * sensor is saved in the cache with the following key: `data:humidity:${sensorId}`
   * and have a maximum size of `MAX_HUMIDITY_CACHE_SIZE`.
   * @param dto humidity sensor data and sensor id
   */
  async saveHumidityData(dto: IncHumiditySensorDataDto) {
    // Check if the sensor is registered
    const registeredSensors = await this.getRegisteredHumiditySensors();

    // If the sensor is not registered, creates a new registry for the sensor
    if (!registeredSensors.includes(dto.sensorId)) {
      registeredSensors.push(dto.sensorId);

      // Since a new sensor is active, we need to notify the gateway
      // We want to send the data as { data: OutActiveHumiditySensorsDto }
      this._humiditySensorsGateway.emitMessage(
        HumidityOutgoingEvents.HUMIDITY_REGISTERED_SENSORS,
        {
          data: registeredSensors,
        },
      );
    }

    // Wether the sensor is registered or not, creates a new registry for the sensor in the cache
    await this._cacheManager.set<string[]>(
      'sensors:humidity',
      registeredSensors,
    );

    // Get the humidity data from the cache
    let humidityInfo = await this._cacheManager.get<
      HumiditySensorCacheRegistry[]
    >(`data:humidity:${dto.sensorId}`);

    // If the cache doesn't exist, create it
    if (!humidityInfo) {
      humidityInfo = await this._createEmptyHumidityInfoCache(dto.sensorId);
    }

    // If the cache has `MAX_HUMIDITY_CACHE_SIZE` records, remove the last one
    if (humidityInfo.length === this.MAX_HUMIDITY_CACHE_SIZE) {
      humidityInfo.pop();
    }

    // Add the new humidity to the cache
    humidityInfo.unshift({
      date: new Date(),
      humidity: dto.humidity,
    });

    // Save the cache
    await this._cacheManager.set(`data:humidity:${dto.sensorId}`, humidityInfo);

    // Emit the new humidity data to the gateway
    // In this case we want to emit the data as { data: OutSensorsCachedDataDto }
    this._humiditySensorsGateway.emitMessage(
      `${HumidityOutgoingEvents.HUMIDITY_UPDATE}-${dto.sensorId}`,
      {
        data: humidityInfo,
      },
    );
  }

  /**
   * Retrieves the data of the humidity sensor with the given id
   * @param sensorId Id of the sensor
   * @returns An array with the last `MAX_HUMIDITY_CACHE_SIZE` humidity data of the sensor
   */
  async getHumidityFromCache(
    sensorId: string,
  ): Promise<HumiditySensorCacheRegistry[]> {
    const cachedHumidityData = await this._cacheManager.get<
      HumiditySensorCacheRegistry[]
    >(`data:humidity:${sensorId}`);

    if (!cachedHumidityData) {
      return [];
    }

    return cachedHumidityData;
  }

  /**
   * Retrieves the active sensors from the cache
   * @returns An array with the ids of the active humidity sensors
   */
  async getRegisteredHumiditySensors(): Promise<string[]> {
    const registeredSensors = await this._cacheManager.get<string[]>(
      'sensors:humidity',
    );

    if (!registeredSensors) {
      return this._createEmptyRegisteredSensorsCache();
    }

    return registeredSensors;
  }

  /**
   * Query the database fo the stored humidity data for the given sensorId
   * @param sensorId Id of the sensor
   * @returns An array with the last id of the humidity registry, the humidity and the date
   */
  async getHumiditiesFromDatabase(sensorId: string): Promise<HumidityData[]> {
    const humidities = await this._prismaService.humidityData.findMany({
      select: {
        id: true,
        humidity: true,
        date: true,
        sensor: false,
        sensorId: true,
      },
      where: {
        sensorId,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!humidities) {
      return [];
    }

    return humidities;
  }

  /**
   * Saves the humidity of the registered humidity sensors in the database
   * every `SENSOR_DATA_SAVE_INTERVAL` time, this time can be passed as an argument.
   * Only if these sensors are also active in the cache (The active property is managed
   * by the sensors service, since a sensor can stream multiple information)
   * @see SensorsService
   */
  @Cron(CronExpressionsEnum.EVERY_TWO_MINUTES)
  async saveLastHumidityData() {
    const registeredSensors = await this.getRegisteredHumiditySensors();
    const systemSensors = await this._sensorsService.getSystemSensors();

    const activatedSensors: string[] = [];

    // Iterate over the system sensors and check if the sensor is active
    Object.entries(systemSensors).forEach(([sensorId, activated]) => {
      if (activated) {
        activatedSensors.push(sensorId);
      }
    });

    // Create a new array with the sensors that are active and are part of the
    // registered humidity sensors
    const registeredAndActivatedSensors = registeredSensors.filter((sensorId) =>
      activatedSensors.includes(sensorId),
    );

    // Iterate over the sensors that are active and are part of the registered humidity sensors
    // and save the last humidity data
    for (const sensorId of registeredAndActivatedSensors) {
      const humidityInfo = await this.getHumidityFromCache(sensorId);

      if (humidityInfo.length > 0) {
        // Check if the sensor exists in the database
        const sensor = await this._prismaService.sensor.findUnique({
          where: {
            id: sensorId,
          },
        });

        if (!sensor) {
          await this._prismaService.sensor.create({
            data: {
              id: sensorId,
            },
          });
        }

        const lastHumidity = Number(humidityInfo[0].humidity);
        const lastHumidityDate = new Date(humidityInfo[0].date);

        await this._prismaService.humidityData.create({
          data: {
            humidity: lastHumidity,
            date: lastHumidityDate,
            sensorId,
          },
        });
        this._logger.log(
          `Humidity data saved for sensor ${sensorId} with value ${lastHumidity}`,
        );
      }
    }
  }

  /**
   * Creates an empty array for the cache for the given sensorId
   * @param sensorId Id of the sensor
   * @returns An empty array
   */
  private async _createEmptyHumidityInfoCache(
    sensorId: string,
  ): Promise<HumiditySensorCacheRegistry[]> {
    await this._cacheManager.set<HumiditySensorCacheRegistry[]>(
      `data:humidity:${sensorId}`,
      [],
    );
    return [];
  }

  /**
   * Creates a new registry in the cache to save the list of all active sensors
   * @returns An empty array of strings
   */
  private async _createEmptyRegisteredSensorsCache(): Promise<string[]> {
    await this._cacheManager.set<string[]>('sensors:humidity', []);
    return [];
  }
}
