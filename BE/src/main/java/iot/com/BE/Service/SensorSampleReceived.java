package iot.com.BE.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SensorSampleReceived(LocalDateTime measuredAt, BigDecimal temperature,
        BigDecimal humidity, BigDecimal light) {
    public BigDecimal valueFor(String sensor) {
        return switch (sensor) {
            case "temperature" -> temperature;
            case "humidity" -> humidity;
            case "light" -> light;
            default -> throw new IllegalArgumentException("Unknown sensor: " + sensor);
        };
    }
}
