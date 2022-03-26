import {
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { TemperatureData } from '@prisma/client';
import { Cache } from 'cache-manager';
import { TimeInMsEnums } from '../../../common/enums';
import { CronExpressionsEnum } from '../../../common/enums/cron.enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { IncTemperatureSensorDataDto } from '../dtos';
import { TempOutgoingEvents } from '../enums';
import { TemperatureSensorsGateway } from '../gateways/temperature.sensors.gateway';
import {
  TemperatureIntervalCacheRegistry,
  TemperatureSensorCacheRegistry,
} from '../types';

@Injectable()
export class TemperatureSensorsService {
  private readonly _cacheManager: Cache;
  private readonly _schedulerRegistry: SchedulerRegistry;
  private readonly _prismaService: PrismaService;
  private readonly _temperatureSensorsGateway: TemperatureSensorsGateway;
  private readonly _logger = new Logger(TemperatureSensorsService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    schedulerRegistry: SchedulerRegistry,
    prismaService: PrismaService,
    @Inject(forwardRef(() => TemperatureSensorsGateway))
    temperatureSensorsGateway: TemperatureSensorsGateway,
  ) {
    this._cacheManager = cacheManager;
    this._schedulerRegistry = schedulerRegistry;
    this._prismaService = prismaService;
    this._temperatureSensorsGateway = temperatureSensorsGateway;
  }

  MAX_TEMPERATURE_CACHE_SIZE = 30;

  /**
   * Adds a temperature to the cache for the given sensorId, adds the
   * temperature at the beginning of the array, the data of a specific
   * sensor is saved in the cache with the following key: `data:temperature:${sensorId}`
   * and have a maximum size of `MAX_TEMPERATURE_CACHE_SIZE`.
   * Also adds a new interval to save the last data of the cache in the database
   * for every iteration of the interval.
   * @param dto Temperature sensor data and sensor id
   */
  async saveTemperatureData(dto: IncTemperatureSensorDataDto) {
    // Check if the sensor is active
    let activeSensors = await this._cacheManager.get<string[]>(
      'sensors:temperature',
    );

    // If the sensor is not active, creates a new registry for the sensor
    if (!activeSensors) {
      activeSensors = await this._createEmptyActiveSensorsCache();
    }

    // If the sensor is not active, creates a new registry for the sensor
    if (!activeSensors.includes(dto.sensorId)) {
      activeSensors.push(dto.sensorId);

      // Since a new sensor is active, we need to notify the gateway
      // We want to send the data as { data: OutActiveTemperatureSensorsDto }
      this._temperatureSensorsGateway.emitMessage(
        TempOutgoingEvents.TEMPERATURE_ACTIVE_SENSORS,
        {
          data: activeSensors,
        },
      );
    }

    // Wether the sensor is active or not, creates a new registry for the sensor in the cache
    await this._cacheManager.set<string[]>(
      'sensors:temperature',
      activeSensors,
    );

    // Get the temperature data from the cache
    let temperatureInfo = await this._cacheManager.get<
      TemperatureSensorCacheRegistry[]
    >(`data:temperature:${dto.sensorId}`);

    // If the cache doesn't exist, create it
    if (!temperatureInfo) {
      temperatureInfo = await this._createEmptyTemperatureInfoCache(
        dto.sensorId,
      );
    }

    // If the cache has `MAX_TEMPERATURE_CACHE_SIZE` records, remove the last one
    if (temperatureInfo.length === this.MAX_TEMPERATURE_CACHE_SIZE) {
      temperatureInfo.pop();
    }

    // Add the new temperature to the cache
    temperatureInfo.unshift({
      date: new Date(),
      temperature: dto.temperature,
    });

    // Save the cache
    await this._cacheManager.set(
      `data:temperature:${dto.sensorId}`,
      temperatureInfo,
    );

    // Emit the new temperature data to the gateway
    // In this case we want to emit the data as { data: OutSensorsCachedDataDto }
    this._temperatureSensorsGateway.emitMessage(
      `${TempOutgoingEvents.TEMPERATURE_UPDATE}-${dto.sensorId}`,
      {
        data: temperatureInfo,
      },
    );

    // Check of the sensor has an attached interval
    let cachedIntervals =
      await this._cacheManager.get<TemperatureIntervalCacheRegistry>(
        `intervals:temperature`,
      );

    // If there is no active interval for the given sensorId, create an empty array
    if (!cachedIntervals) {
      cachedIntervals = await this._createTemperatureIntervalCacheRegistry();
    }

    // Check if the interval for the given sensorId is active, if not, create an interval
    if (!cachedIntervals[dto.sensorId]) {
      // Creates an interval to save the last data of the cache for the persisted database
      // following the given interval
      this._savePersistentTemperatureData(
        dto.sensorId,
        TimeInMsEnums.THIRTY_SECONDS,
      );
    }

    // Update the interval cache registry with the sensorId entrance
    cachedIntervals[dto.sensorId] = new Date();

    // Save the interval cache registry
    await this._cacheManager.set<TemperatureIntervalCacheRegistry>(
      'intervals:temperature',
      cachedIntervals,
    );
  }

  /**
   * Retrieves the data of the temperature sensor with the given id
   * @param sensorId Id of the sensor
   * @returns An array with the last `MAX_TEMPERATURE_CACHE_SIZE` temperatures of the sensor
   */
  async getTemperatureFromCache(
    sensorId: string,
  ): Promise<TemperatureSensorCacheRegistry[]> {
    const cachedTempData = await this._cacheManager.get<
      TemperatureSensorCacheRegistry[]
    >(`data:temperature:${sensorId}`);

    if (!cachedTempData) {
      return [];
    }

    return cachedTempData;
  }

  /**
   * Retrieves the active sensors from the cache
   * @returns An array with the ids of the active temperature sensors
   */
  async getActiveTemperatureSensors(): Promise<string[]> {
    const activeSensors = await this._cacheManager.get<string[]>(
      'sensors:temperature',
    );

    if (!activeSensors) {
      return [];
    }

    return activeSensors;
  }

  /**
   * Query the database fo the stored temperature data for the given sensorId
   * @param sensorId Id of the sensor
   * @returns An array with the last id of the temperature registry, the temperature and the date
   */
  async getTemperatureFromDatabase(
    sensorId: string,
  ): Promise<TemperatureData[]> {
    const temperatures = await this._prismaService.temperatureData.findMany({
      select: {
        id: true,
        temperature: true,
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

    if (!temperatures) {
      return [];
    }

    return temperatures;
  }

  /**
   * Checks if the interval and the last data of the cache for the given sensorId
   * are separated, if the threshold is reached, cleans the interval and removes
   * it from the cache.
   * @returns If there are no active intervals to be cleaned
   */
  @Cron(CronExpressionsEnum.EVERY_MINUTE)
  async intervalCleaner() {
    const cachedIntervals =
      await this._cacheManager.get<TemperatureIntervalCacheRegistry>(
        `intervals:temperature`,
      );
    // If there is no active intervals, return
    if (!cachedIntervals) {
      return;
    }
    // For every active interval, check if the time has expired to
    // stop the saving process to the database
    for (const sensorId in cachedIntervals) {
      const lastInterval = cachedIntervals[sensorId];
      const timeDiff = Date.now() - new Date(lastInterval).getTime();
      // If the time has expired, remove the interval from the cache
      if (timeDiff >= TimeInMsEnums.ONE_MINUTE) {
        // Clear the interval
        const intervals = this._schedulerRegistry.getIntervals();
        if (intervals.includes(sensorId)) {
          this._stopSavePersistentTemperatureData(sensorId);
        }
        // Save the updated cache
        delete cachedIntervals[sensorId];
        await this._cacheManager.set<TemperatureIntervalCacheRegistry>(
          'intervals:temperature',
          cachedIntervals,
        );
      }
    }
  }

  /**
   * Creates an empty array for the cache for the given sensorId
   * @param sensorId Id of the sensor
   * @returns An empty array
   */
  private async _createEmptyTemperatureInfoCache(
    sensorId: string,
  ): Promise<TemperatureSensorCacheRegistry[]> {
    await this._cacheManager.set(`data:temperature:${sensorId}`, []);
    return [];
  }

  /**
   * Creates an empty array if there is no active interval for temperatures
   * with a time to live of two minutes
   * @returns An empty array
   */
  private async _createTemperatureIntervalCacheRegistry(): Promise<TemperatureIntervalCacheRegistry> {
    await this._cacheManager.set<TemperatureIntervalCacheRegistry>(
      `intervals:temperature`,
      {},
    );
    return {};
  }

  /**
   * Creates a new registry in the cache to save the list of all active sensors
   * @returns An empty array of strings
   */
  private async _createEmptyActiveSensorsCache(): Promise<string[]> {
    await this._cacheManager.set<string[]>('sensors:temperature', []);
    return [];
  }

  /**
   * Creates an interval to save the last data of the cache for the given sensorId
   * in the database following the given interval
   * @param sensorId Name of the interval, in this case the name of the sensor
   * @param milliseconds Interval time in milliseconds
   */
  private _savePersistentTemperatureData(
    sensorId: string,
    milliseconds: number,
  ) {
    const callback = async () => {
      // Get the general data of the sensor
      let sensor = await this._prismaService.temperatureSensor.findUnique({
        where: {
          id: sensorId,
        },
      });

      // If the sensor doesn't exist, create it
      if (!sensor) {
        await this._prismaService.temperatureSensor.create({
          data: {
            id: sensorId,
          },
        });

        sensor = {
          id: sensorId,
        };
      }

      // Get the cached data of the sensor
      const temperatureInfo = await this._cacheManager.get<
        TemperatureSensorCacheRegistry[]
      >(`data:temperature:${sensorId}`);

      // Save the last data of the cache in the database
      await this._prismaService.temperatureData.create({
        data: {
          temperature: Number(temperatureInfo[0].temperature),
          date: new Date(temperatureInfo[0].date),
          sensorId: sensor.id,
        },
      });
      this._logger.log(
        `Saved temperature data for ${sensorId} in the persistent database`,
      );
    };

    const interval = setInterval(callback, milliseconds);
    this._schedulerRegistry.addInterval(sensorId, interval);
  }

  /**
   * Stops the recurring information saving for the given sensorId
   * @param name Name of the interval, in this case the name of the sensor
   */
  private _stopSavePersistentTemperatureData(name: string) {
    this._schedulerRegistry.deleteInterval(name);
    this._logger.log(`Stopped saving process for the sensor ${name}`);
  }
}
