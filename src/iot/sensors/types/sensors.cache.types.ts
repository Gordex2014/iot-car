/**
 * Cache information for sensors with the information that they are
 * activated or deactivated in the source (iot device).
 */
export interface SystemSensorsInCache {
  [sensorId: string]: boolean;
}
