import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ActiveSensorsInCache } from '../types';

@Injectable()
export class SensorsService {
  private readonly _cacheManager: Cache;
  private readonly _logger = new Logger(SensorsService.name);

  constructor(@Inject(CACHE_MANAGER) cacheManager: Cache) {
    this._cacheManager = cacheManager;
  }

  /**
   * Adds a new sensor to the registry of active sensors in the cache
   * @param sensorId The id of the sensor that is being activated
   * @returns void
   */
  async activateSensor(sensorId: string): Promise<void> {
    // Check if the sensor is already activated
    let activeSensorsObj = await this._cacheManager.get<ActiveSensorsInCache>(
      'sensors:active',
    );

    // If there are no active sensors, create a new cache entry
    if (!activeSensorsObj) {
      activeSensorsObj = await this._createActiveSensorsCache();
    }

    // Check if the sensor is already activated
    if (activeSensorsObj[sensorId]) {
      this._logger.warn(`Sensor ${sensorId} is already activated.`);
      return;
    }

    // Activate the sensor
    activeSensorsObj[sensorId] = true;

    // Save the new active sensors to the cache
    await this._cacheManager.set<ActiveSensorsInCache>(
      'sensors:active',
      activeSensorsObj,
    );

    this._logger.log(`Sensor ${sensorId} is streaming data.`);
  }

  /**
   * Removes a sensor from the registry of active sensors in the cache
   * @param sensorId The id of the sensor that is being deactivated
   * @returns void
   */
  async deactivateSensor(sensorId: string): Promise<void> {
    // Check if the sensor is already activated
    let activeSensorsObj = await this._cacheManager.get<ActiveSensorsInCache>(
      'sensors:active',
    );

    // If there are no active sensors, create a new cache entry
    if (!activeSensorsObj) {
      activeSensorsObj = await this._createActiveSensorsCache();
    }

    // Check if the sensor is already activated
    if (!activeSensorsObj[sensorId]) {
      this._logger.warn(`Sensor ${sensorId} is already deactivated.`);
      return;
    }

    // Deactivate the sensor
    activeSensorsObj[sensorId] = false;

    // Save the new active sensors to the cache
    await this._cacheManager.set<ActiveSensorsInCache>(
      'sensors:active',
      activeSensorsObj,
    );

    this._logger.log(`Sensor ${sensorId} is no longer streaming data.`);
  }

  /**
   * Creates a new empty registry for the active sensors in the cache
   * @returns An empty object that will be used as a cache for the active sensors
   */
  private async _createActiveSensorsCache(): Promise<ActiveSensorsInCache> {
    const newActiveSensors: ActiveSensorsInCache = {};

    await this._cacheManager.set<ActiveSensorsInCache>(
      'sensors:active',
      newActiveSensors,
    );

    return newActiveSensors;
  }
}
