#!/usr/bin/python
import json
import requests
import sys
import time
import datetime
import paho.mqtt.client as mqtt
import Adafruit_DHT


# ==================================================================================================================================================
# Usage
# python mqtt.channel.py <temp topic> <humidity topic> <gpio pin> <optional update frequency>
# eg python mqtt.channel.py 'cupboard/temperature1' 'cupboard/humidity1' 4
# will start an instance using 'cupboard/temperature1' as the temperature topic, and using gpio port 4 to talk to a DHT22 sensor
# it will use the default update time of 300 secons.
# ==================================================================================================================================================

# Type of sensor, can be Adafruit_DHT.DHT11, Adafruit_DHT.DHT22, or Adafruit_DHT.AM2302.
DHT_TYPE = Adafruit_DHT.DHT11

# Example of sensor connected to Raspberry Pi pin 23
DHT_GPIO_PIN = 17
# Example of sensor connected to Beaglebone Black pin P8_11
#DHT_PIN  = 'P8_11'

# Sensor id
SENSOR_ID = 'sensor-1'

MOSQUITTO_HOST = 'test.mosquitto.org'
MOSQUITTO_PORT = 1883

# Topics
MOSQUITTO_BASE_TOPIC = 'iot-car-gd'
MOSQUITTO_TEMPERATURE_DATA_TOPIC = MOSQUITTO_BASE_TOPIC + '/temperature-sensor/data'
MOSQUITTO_HUMIDITY_DATA_TOPIC = MOSQUITTO_BASE_TOPIC + '/humidity-sensor/data'
MOSQUITTO_CONNECTION_TOPIC = MOSQUITTO_BASE_TOPIC + '/sensor/connection'

# Initialization
print('Mosquitto temperature data topic {0}'.format(
    MOSQUITTO_TEMPERATURE_DATA_TOPIC))
print('Mosquitto humidity data topic {0}'.format(
    MOSQUITTO_HUMIDITY_DATA_TOPIC))
print('Mosquitto connection topic {0}'.format(MOSQUITTO_CONNECTION_TOPIC))

# How long to wait (in seconds) between measurements.
FREQUENCY_SECONDS = 5

print('Logging sensor measurements to {0} every {1} seconds.'.format(
    MOSQUITTO_HOST, FREQUENCY_SECONDS))
print('Press Ctrl-C to quit.')
print('Connecting to MQTT on {0}'.format(MOSQUITTO_HOST))

mqttc = mqtt.Client("temp-humidity-sensor-1")

# Creating a will if the sensor disconnects
offline_payload = json.dumps(
    {"activated": False, "sensorId":  "{0}".format(SENSOR_ID)})
mqttc.will_set(MOSQUITTO_CONNECTION_TOPIC,
               offline_payload, qos=1, retain=False)

# Creating a connection to the mqtt broker
online_payload = json.dumps(
    {"activated": True, "sensorId":  "{0}".format(SENSOR_ID)})

mqttc.connect(MOSQUITTO_HOST, MOSQUITTO_PORT, keepalive=FREQUENCY_SECONDS+10)
mqttc.publish(MOSQUITTO_CONNECTION_TOPIC, online_payload, qos=1, retain=False)

# Sending sensor reads
try:
    while True:
        # Attempt to get sensor reading.
        humidity, temp = Adafruit_DHT.read(DHT_TYPE, DHT_GPIO_PIN)

        # Skip to the next reading if a valid measurement couldn't be taken.
        # This might happen if the CPU is under a lot of load and the sensor
        # can't be reliably read (timing is critical to read the sensor).
        if humidity is None or temp is None:
            time.sleep(2)
            continue

        currentdate = time.strftime('%Y-%m-%d %H:%M:%S')
        print('Date Time:   {0}'.format(currentdate))
        print('Temperature: {0:0.2f} C'.format(temp))
        print('Humidity:    {0:0.2f} %'.format(humidity))

        # Publish to the MQTT channel
        try:
            print('Updating {0}'.format(MOSQUITTO_TEMPERATURE_DATA_TOPIC))
            temp_json = json.dumps({"temperature": "{0}".format(
                temp), "sensorId":  "{0}".format(SENSOR_ID)})
            print(temp_json)
            (result1, mid) = mqttc.publish(
                MOSQUITTO_TEMPERATURE_DATA_TOPIC, temp_json, 0)
            print('Updating {0}'.format(MOSQUITTO_HUMIDITY_DATA_TOPIC))
            time.sleep(1)

            humidity_json = json.dumps({"humidity": "{0}".format(
                temp), "sensorId":  "{0}".format(SENSOR_ID)})
            print(humidity_json)
            (result2, mid) = mqttc.publish(
                MOSQUITTO_HUMIDITY_DATA_TOPIC, humidity_json, 0)
            print('MQTT Updated result {0} and {1}'.format(result1, result2))
            if result1 == 1 or result2 == 1:
                raise ValueError('Result for one message was not 0')

        except Exception:
            # Error appending data, most likely because credentials are stale.
            # Null out the worksheet so a login is performed at the top of the loop.
            print('Append error, logging in again: ' + str(Exception.mro))
            continue

        # Wait 30 seconds before continuing
        print('Wrote a message to MQTT broker')
        time.sleep(FREQUENCY_SECONDS)

except Exception as e:
    print('Error connecting to the MQTT server: {0}'.format(e))
