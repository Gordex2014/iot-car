# MQTT topics

These are all the topics that are used by the MQTT broker to communicate with the
server, based on the type of sensor.

## Connection

When the device is connected, the device should notify the server that it is connected, it should
also leave a will message to indicate that the device is disconnected if something goes wrong.

`MOSQUITTO_BASE_TOPIC + '/sensor/connection'`

Data if connected:

```json
{
    "activated": true,
    "sensorId": "your_sensor_id"
}
```

Will message if disconnected:

```json
{
    "activated": false,
    "sensorId": "your_sensor_id"
}
```

## Temperature

All the data will be sent to the following topic:

`MOSQUITTO_BASE_TOPIC + '/temperature-sensor/data'`

Data:

When a device is sending data to the client, it will send the temperature in
the following format:

```json
{
  "temperature": 23.0,
  "sensorId": "your_sensor_id"
}
```

The server will assume that the temperature is in Celsius.

## Humidity

All the data will be sent to the following topic:

`MOSQUITTO_BASE_TOPIC + '/humidity-sensor/data'`

Data:

When a device is sending data to the client, it will send the humidity in
the following format:

```json
{
  "humidity": 50.0,
  "sensorId": "your_sensor_id"
}
```

The server will assume that the humidity is in %.