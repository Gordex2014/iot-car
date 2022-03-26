/**
 * Incoming data transfer object from the iot device to
 * tell the server that the sensor is activated.
 * @param sensorId is the id of the sensor
 */
export interface IncSensorConnectionDto {
  sensorId: string;
  activated: boolean;
}

/**
 * Incoming data transfer object from the iot device to
 * tell the server that the sensor is deactivated.
 * @param sensorId is the id of the sensor
 */
export interface IncSensorDeactivateDto {
  sensorId: string;
}
