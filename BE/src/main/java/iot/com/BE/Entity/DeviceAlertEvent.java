package iot.com.BE.Entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "device_alert_events",
        indexes = @Index(name = "idx_alert_measured", columnList = "measured_at,device_code"),
        uniqueConstraints = @UniqueConstraint(name = "uk_alert_device_sample",
                columnNames = { "device_code", "measured_at" }))
public class DeviceAlertEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_code", nullable = false, length = 10)
    private String deviceCode;

    @Column(name = "sensor_code", nullable = false, length = 20)
    private String sensorCode;

    @Column(name = "sensor_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal sensorValue;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal threshold;

    @Column(name = "measured_at", nullable = false)
    private LocalDateTime measuredAt;

    public Long getId() { return id; }
    public String getDeviceCode() { return deviceCode; }
    public void setDeviceCode(String deviceCode) { this.deviceCode = deviceCode; }
    public String getSensorCode() { return sensorCode; }
    public void setSensorCode(String sensorCode) { this.sensorCode = sensorCode; }
    public BigDecimal getSensorValue() { return sensorValue; }
    public void setSensorValue(BigDecimal sensorValue) { this.sensorValue = sensorValue; }
    public BigDecimal getThreshold() { return threshold; }
    public void setThreshold(BigDecimal threshold) { this.threshold = threshold; }
    public LocalDateTime getMeasuredAt() { return measuredAt; }
    public void setMeasuredAt(LocalDateTime measuredAt) { this.measuredAt = measuredAt; }
}
