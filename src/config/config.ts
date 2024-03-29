export default () => ({
  port: parseInt(process.env.HTTP_PORT, 10) || 3003,
  db: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:123@localhost:5432/dev?schema=public',
  },
  jwt: {
    expiration: process.env.JWT_EXPIRATION || '7h',
    secret: process.env.JWT_SECRET || 'super-secret',
  },
  mqtt: {
    broker: {
      url: process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883',
    },
  },
});
