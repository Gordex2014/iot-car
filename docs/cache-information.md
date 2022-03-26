# Cache information

These are the following keys used to store information in the cache, and
a brief description of what they are used for.

## Sensor keys

| Key             | Description                                                                |
| ----------------- | ------------------------------------------------------------------ |
| sensors:active | An object containing a hash table with the sensor id as key and a boolean value that indicates if the sensor is active or not. |
## Temperature keys

| Key             | Description                                                                |
| ----------------- | ------------------------------------------------------------------ |
| data:temperature:{sensorId} | The values of the last temperatures registries per sensor |
| sensors:temperature | The list of sensors that are currently registered and have data in the cache, these data can be accessed through the sensor specific key temperature:{sensorId}. |
