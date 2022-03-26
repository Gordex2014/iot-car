/**
 * All the existing topics for the sensors
 * @see base-topic in topic docs if you want to know more about the topic structure
 */
export enum TemperatureSensorTopics {
  TEMPERATURE_DATA = 'iot-car-gd/temperature-sensor/data',
  TEMPERATURE_ACTIVE = 'iot-car-gd/temperature-sensor/active',
  TEMPERATURE_INACTIVE = 'iot-car-gd/temperature-sensor/inactive',
}
