import {
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TemperatureData } from '@prisma/client';
import { Cache } from 'cache-manager';
import { CronExpressionsEnum } from '../../../common/enums/cron.enums';
import { PrismaService } from '../../../prisma/prisma.service';
import { IncTemperatureSensorDataDto } from '../dtos';
import { TempOutgoingEvents } from '../enums';
import { TemperatureSensorsGateway } from '../gateways';
import { TemperatureSensorCacheRegistry } from '../types';
import { SensorsService } from './sensors.service';

@Injectable()
export class TemperatureSensorsService {
  private readonly _cacheManager: Cache;
  private readonly _prismaService: PrismaService;
  private readonly _sensorsService: SensorsService;
  private readonly _temperatureSensorsGateway: TemperatureSensorsGateway;
  private readonly _logger = new Logger(TemperatureSensorsService.name);

  constructor(
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    prismaService: PrismaService,
    sensorsService: SensorsService,
    @Inject(forwardRef(() => TemperatureSensorsGateway))
    temperatureSensorsGateway: TemperatureSensorsGateway,
  ) {
    this._cacheManager = cacheManager;
    this._prismaService = prismaService;
    this._sensorsService = sensorsService;
    this._temperatureSensorsGateway = temperatureSensorsGateway;
  }

  MAX_TEMPERATURE_CACHE_SIZE = 30;

  /**
   * Adds a temperature to the cache for the given sensorId, adds the
   * temperature at the beginning of the array, the data of a specific
   * sensor is saved in the cache with the following key: `data:temperature:${sensorId}`
   * and have a maximum size of `MAX_TEMPERATURE_CACHE_SIZE`.
   * @param dto Temperature sensor data and sensor id
   */
  async saveTemperatureData(dto: IncTemperatureSensorDataDto) {
    // Check if the sensor is registered
    const registeredSensors = await this.getRegisteredTemperatureSensors();

    // If the sensor is not registered, creates a new registry for the sensor
    if (!registeredSensors.includes(dto.sensorId)) {
      registeredSensors.push(dto.sensorId);

      // Since a new sensor is active, we need to notify the gateway
      // We want to send the data as { data: OutActiveTemperatureSensorsDto }
      this._temperatureSensorsGateway.emitMessage(
        TempOutgoingEvents.TEMPERATURE_REGISTERED_SENSORS,
        {
          data: registeredSensors,
        },
      );
    }

    // Wether the sensor is registered or not, creates a new registry for the sensor in the cache
    await this._cacheManager.set<string[]>(
      'sensors:temperature',
      registeredSensors,
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
  async getRegisteredTemperatureSensors(): Promise<string[]> {
    const registeredSensors = await this._cacheManager.get<string[]>(
      'sensors:temperature',
    );

    if (!registeredSensors) {
      return this._createEmptyRegisteredSensorsCache();
    }

    return registeredSensors;
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
   * Saves the temperatures of the registered temperature sensors in the database
   * every `SENSOR_DATA_SAVE_INTERVAL` time, this time can be passed as an argument.
   * Only if these sensors are also active in the cache (The active property is managed
   * by the sensors service, since a sensor can stream multiple information)
   * @see SensorsService
   */
  @Cron(CronExpressionsEnum.EVERY_TWO_MINUTES)
  async saveLastTemperatureData() {
    const registeredSensors = await this.getRegisteredTemperatureSensors();
    const systemSensors = await this._sensorsService.getSystemSensors();

    const activatedSensors: string[] = [];

    // Iterate over the system sensors and check if the sensor is active
    Object.entries(systemSensors).forEach(([sensorId, activated]) => {
      if (activated) {
        activatedSensors.push(sensorId);
      }
    });

    // Create a new array with the sensors that are active and are part of the
    // registered temperature sensors
    const registeredAndActivatedSensors = registeredSensors.filter((sensorId) =>
      activatedSensors.includes(sensorId),
    );

    // Iterate over the sensors that are active and are part of the registered temperature sensors
    // and save the last temperature data
    for (const sensorId of registeredAndActivatedSensors) {
      const temperatureInfo = await this.getTemperatureFromCache(sensorId);

      if (temperatureInfo.length > 0) {
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

        const lastTemperature = Number(temperatureInfo[0].temperature);
        const lastTemperatureDate = new Date(temperatureInfo[0].date);

        await this._prismaService.temperatureData.create({
          data: {
            temperature: lastTemperature,
            date: lastTemperatureDate,
            sensorId,
          },
        });
        this._logger.log(
          `Temperature data saved for sensor ${sensorId} with value ${lastTemperature}`,
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
    await this._cacheManager.set<TemperatureSensorCacheRegistry[]>(
      `data:temperature:${sensorId}`,
      [],
    );
    return [];
  }

  /**
   * Creates a new registry in the cache to save the list of all active sensors
   * @returns An empty array of strings
   */
  private async _createEmptyRegisteredSensorsCache(): Promise<string[]> {
    await this._cacheManager.set<string[]>('sensors:temperature', []);
    return [];
  }
}
