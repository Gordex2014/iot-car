# Cache information

These are the following keys used to store information in the cache, and
a brief description of what they are used for.

## Temperature keys

| Key             | Description                                                                |
| ----------------- | ------------------------------------------------------------------ |
| data:temperature:${sensorId} | The values of the last temperatures registries per sensor |
| intervals:temperature | Internal active intervals running, these intervals are used to save the temperature values to the persistent database every predefined period of time. |
| sensors:temperature | The list of sensors that are currently active and have data in the cache, these data can be accessed through the sensor specific key temperature:${sensorId}. |
| sensors:active | An object containing a hash table with the sensor id as key and a boolean value that indicates if the sensor is active or not. |