package iot.com.BE.Entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "device_alert_rules")
public class DeviceAlertRule {
    @Id
    @Column(name = "device_code", length = 10)
    private String deviceCode;

    @Column(name = "sensor_code", nullable = false, length = 20)
    private String sensorCode;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal threshold;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "latest_value", precision = 12, scale = 2)
    private BigDecimal latestValue;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    public String getDeviceCode() { return deviceCode; }
    public void setDeviceCode(String deviceCode) { this.deviceCode = deviceCode; }
    public String getSensorCode() { return sensorCode; }
    public void setSensorCode(String sensorCode) { this.sensorCode = sensorCode; }
    public BigDecimal getThreshold() { return threshold; }
    public void setThreshold(BigDecimal threshold) { this.threshold = threshold; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public BigDecimal getLatestValue() { return latestValue; }
    public void setLatestValue(BigDecimal latestValue) { this.latestValue = latestValue; }
    public LocalDateTime getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(LocalDateTime measuredAt) { this.measuredAt = measuredAt; }
}
