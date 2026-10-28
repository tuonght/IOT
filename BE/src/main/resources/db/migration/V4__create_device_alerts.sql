CREATE TABLE IF NOT EXISTS device_alert_rules (
    device_code VARCHAR(10) NOT NULL,
    sensor_code VARCHAR(20) NOT NULL,
    threshold DECIMAL(12, 2) NOT NULL,
    active BIT NOT NULL DEFAULT 0,
    latest_value DECIMAL(12, 2) NULL,
    measured_at DATETIME(6) NULL,
    PRIMARY KEY (device_code)
);

CREATE TABLE IF NOT EXISTS device_alert_events (
    id BIGINT NOT NULL AUTO_INCREMENT,
    device_code VARCHAR(10) NOT NULL,
    sensor_code VARCHAR(20) NOT NULL,
    sensor_value DECIMAL(12, 2) NOT NULL,
    threshold DECIMAL(12, 2) NOT NULL,
    measured_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_alert_device_sample (device_code, measured_at),
    KEY idx_alert_measured (measured_at, device_code)
);
