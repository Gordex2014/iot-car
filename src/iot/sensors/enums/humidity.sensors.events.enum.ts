export enum HumidityIncomingEvents {
  HUMIDITY_DATA = 'humidity-data',
}

/**
 * This enum contains the events that are sent to the client.
 * @see humidity-cache-data-update-${sensorId}
 */
export enum HumidityOutgoingEvents {
  // This is an incoming event, to subscribe to this event you should append the sensor id to the event name
  // humidity-cache-data-update-${sensorId}
  HUMIDITY_UPDATE = 'humidity-cache-data-update',
  HUMIDITY_REGISTERED_SENSORS = 'humidity-registered-sensors',
}
