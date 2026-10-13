CREATE TABLE IF NOT EXISTS sensor_data (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sensor_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    value DECIMAL(10, 2) NOT NULL,
    measured_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_sensor_measured (sensor_id, measured_at),
    KEY idx_sensor_data_user (user_id),
    CONSTRAINT fk_sensor_data_sensor
        FOREIGN KEY (sensor_id) REFERENCES sensors (id),
    CONSTRAINT fk_sensor_data_user
        FOREIGN KEY (user_id) REFERENCES users (id)
);
