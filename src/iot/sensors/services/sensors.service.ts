import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { SystemSensorsInCache } from '../types';

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
    let systemSensorsObj = await this._cacheManager.get<SystemSensorsInCache>(
      'sensors:system',
    );

    // If there are no active sensors, create a new cache entry
    if (!systemSensorsObj) {
      systemSensorsObj = await this._createSystemSensorsCache();
    }

    // Check if the sensor is already activated
    if (systemSensorsObj[sensorId]) {
      this._logger.warn(`Sensor ${sensorId} is already activated.`);
      return;
    }

    // Activate the sensor
    systemSensorsObj[sensorId] = true;

    // Save the new active sensors to the cache
    await this._cacheManager.set<SystemSensorsInCache>(
      'sensors:system',
      systemSensorsObj,
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
    let systemSensorsObj = await this._cacheManager.get<SystemSensorsInCache>(
      'sensors:system',
    );

    // If there are no active sensors, create a new cache entry
    if (!systemSensorsObj) {
      systemSensorsObj = await this._createSystemSensorsCache();
    }

    // Check if the sensor is already activated
    if (!systemSensorsObj[sensorId]) {
      this._logger.warn(`Sensor ${sensorId} is already deactivated.`);
      return;
    }

    // Deactivate the sensor
    systemSensorsObj[sensorId] = false;

    // Save the new active sensors to the cache
    await this._cacheManager.set<SystemSensorsInCache>(
      'sensors:system',
      systemSensorsObj,
    );

    this._logger.log(`Sensor ${sensorId} is no longer streaming data.`);
  }

  async getSystemSensors(): Promise<SystemSensorsInCache> {
    let systemSensorsObj = await this._cacheManager.get<SystemSensorsInCache>(
      'sensors:system',
    );

    if (!systemSensorsObj) {
      systemSensorsObj = await this._createSystemSensorsCache();
    }

    return systemSensorsObj;
  }

  /**
   * Creates a new empty registry for the system sensors in the cache
   * @returns An empty object that will be used as a cache for the system sensors
   */
  private async _createSystemSensorsCache(): Promise<SystemSensorsInCache> {
    const newSystemSensors: SystemSensorsInCache = {};

    await this._cacheManager.set<SystemSensorsInCache>(
      'sensors:system',
      newSystemSensors,
    );

    return newSystemSensors;
  }
}
