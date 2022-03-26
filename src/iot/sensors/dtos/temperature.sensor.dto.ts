import { TemperatureSensorCacheRegistry } from '../types';

/**
 * Incoming data transfer object from the iot device.
 * @param temperature is the temperature transmitted by the sensor
 * @param sensorId is the id of the sensor
 */
export interface IncTemperatureSensorDataDto {
  temperature: number;
  sensorId: string;
}

/**
 * Incoming data transfer object from the iot device to
 * tell the server that the sensor is activated.
 * @param sensorId is the id of the sensor
 */
export interface IncTemperatureSensorActivatedDto {
  sensorId: string;
}

/**
 * Incoming data transfer object from the iot device to
 * tell the server that the sensor is deactivated.
 * @param sensorId is the id of the sensor
 */
export interface IncTemperatureSensorDeactivateDto {
  sensorId: string;
}

/**
 * Incoming data transfer object from the socket client
 * asking for the temperature data of a sensor
 * @param sensorId is the id of the sensor
 */
export interface IncTemperatureSensorDataRequestDto {
  sensorId: string;
}

/**
 * Outgoing data transfer object from the server to the socket client
 * @param data is the data that holds the temperature data
 * with the temperature values and dates
 */
export interface OutSensorsCachedDataDto {
  data: TemperatureSensorCacheRegistry[];
}

/**
 * Outgoing data transfer object from the server to the socket client
 * @param data is the data that holds the active sensors
 */
export interface OutActiveTemperatureSensorsDto {
  data: string[];
}
