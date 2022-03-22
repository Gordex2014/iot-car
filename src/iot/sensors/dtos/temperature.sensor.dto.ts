import { TemperatureSensorCacheRegistry } from '../types';

export interface OutTemperatureSensorDto {
  temperature: number;
  sensorId: string;
}

export interface IncTemperatureSensorDto {
  sensorId: string;
}

export interface OutSensorsCachedDataDto {
  data: TemperatureSensorCacheRegistry[];
}

export interface OutActiveTemperatureSensorsDto {
  data: string[];
}
