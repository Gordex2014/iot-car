import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TemperatureSensorDto } from '../dtos';

@Injectable()
export class TemperatureSensorsService {
  private readonly _cacheManager: Cache;

  constructor(@Inject(CACHE_MANAGER) cacheManager: Cache) {
    this._cacheManager = cacheManager;
  }

  MAX_TEMPERATURE_CACHE_SIZE = 30;

  /**
   * Adds a temperature to the cache for the given sensorId, adds the
   * temperature at the beginning of the array, the data of a specific
   * sensor is saved in the cache with the following key: `temperature:${sensorId}`
   * and have a maximum size of 30.
   * @param dto Temperature sensor data and sensor id
   */
  async saveTemperatureToCache(dto: TemperatureSensorDto) {
    let temperatureInfo = (await this._cacheManager.get(
      `temperature:${dto.sensorId}`,
    )) as number[];

    // If the cache doesn't exist, create it
    if (!temperatureInfo) {
      temperatureInfo = await this._createEmptyTemperatureInfoCache(
        dto.sensorId,
      );
    }

    // If the cache has 30 records, remove the last one
    if (temperatureInfo.length === this.MAX_TEMPERATURE_CACHE_SIZE) {
      temperatureInfo.pop();
    }

    // Add the new temperature to the cache
    temperatureInfo.unshift(dto.temperature);

    // Save the cache
    await this._cacheManager.set(
      `temperature:${dto.sensorId}`,
      temperatureInfo,
    );
  }

  /**
   * Retrieves the data of the temperature sensor with the given id
   * @param sensorId Id of the sensor
   * @returns An array with the last 30 temperatures of the sensor
   */
  async getTemperatureFromCache(sensorId: string): Promise<number[]> {
    const tempData = (await this._cacheManager.get(
      `temperature:${sensorId}`,
    )) as number[];

    if (!tempData) {
      return [];
    }

    return tempData;
  }

  /**
   * Creates an empty array for the cache for the given sensorId
   * @param sensorId Id of the sensor
   * @returns An empty array
   */
  private async _createEmptyTemperatureInfoCache(
    sensorId: string,
  ): Promise<number[]> {
    await this._cacheManager.set(`temperature:${sensorId}`, []);
    return [];
  }
}
