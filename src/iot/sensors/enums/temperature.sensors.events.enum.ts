export enum TempIncomingEvents {
  TEMPERATURE_DATA = 'temperature-data',
}

/**
 * This enum contains the events that are sent to the client.
 * @see temperature-cache-data-update-${sensorId}
 */
export enum TempOutgoingEvents {
  // This is an incoming event, to subscribe to this event you should append the sensor id to the event name
  // temperature-cache-data-update-${sensorId}
  TEMPERATURE_UPDATE = 'temperature-cache-data-update',
  TEMPERATURE_ACTIVE_SENSORS = 'temperature-active-sensors',
}
