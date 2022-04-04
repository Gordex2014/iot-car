import { HumiditySensorCacheRegistry } from '../types';

/**
 * Incoming data transfer object from the iot device.
 * @param humidity is the humidity value transmitted by the sensor
 * @param sensorId is the id of the sensor
 */
export interface IncHumiditySensorDataDto {
  humidity: number;
  sensorId: string;
}

/**
 * Incoming data transfer object from the socket client
 * asking for the humidity data of a sensor
 * @param sensorId is the id of the sensor
 */
export interface IncHumiditySensorDataRequestDto {
  sensorId: string;
}

/**
 * Outgoing data transfer object from the server to the socket client
 * @param data is the data that holds the humidity data
 * with the humidity values and dates
 */
export interface OutHumiditySensorsCachedDataDto {
  data: HumiditySensorCacheRegistry[];
}

/**
 * Outgoing data transfer object from the server to the socket client
 * @param data is the data that holds the active humidity sensors
 */
export interface OutActiveHumiditySensorsDto {
  data: string[];
}
