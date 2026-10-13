INSERT INTO `SensorData` (sensor_id, user_id, value, measured_at)
SELECT sensor_id, user_id, value, measured_at
FROM sensor_data;

DROP TABLE sensor_data;
