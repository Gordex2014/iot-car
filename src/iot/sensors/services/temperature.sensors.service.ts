import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TemperatureSensorDto } from '../dtos';
import { TemperatureSensorCacheRegistry } from '../types';

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
   * and have a maximum size of `MAX_TEMPERATURE_CACHE_SIZE`.
   * @param dto Temperature sensor data and sensor id
   */
  async saveTemperatureToCache(dto: TemperatureSensorDto) {
    let temperatureInfo = (await this._cacheManager.get(
      `temperature:${dto.sensorId}`,
    )) as TemperatureSensorCacheRegistry[];

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
      date: new Date(Date.now()),
      temperature: dto.temperature,
    });

    // Save the cache
    await this._cacheManager.set(
      `temperature:${dto.sensorId}`,
      temperatureInfo,
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
    const cachedTempData = (await this._cacheManager.get(
      `temperature:${sensorId}`,
    )) as TemperatureSensorCacheRegistry[];

    if (!cachedTempData) {
      return [];
    }

    return cachedTempData;
  }

  /**
   * Creates an empty array for the cache for the given sensorId
   * @param sensorId Id of the sensor
   * @returns An empty array
   */
  private async _createEmptyTemperatureInfoCache(
    sensorId: string,
  ): Promise<TemperatureSensorCacheRegistry[]> {
    await this._cacheManager.set(`temperature:${sensorId}`, []);
    return [];
  }
}
