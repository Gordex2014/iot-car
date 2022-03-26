/**
 * Type of data to be stored in the cache date and temperature
 */
export interface TemperatureSensorCacheRegistry {
  date: Date;
  temperature: number;
}

/**
 * Type of data that stores all the active intervals for temperatures
 */
export interface TemperatureIntervalCacheRegistry {
  [sensorId: string]: Date;
}
