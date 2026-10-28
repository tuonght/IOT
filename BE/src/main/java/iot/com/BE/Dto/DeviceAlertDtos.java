package iot.com.BE.Dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public final class DeviceAlertDtos {
    private DeviceAlertDtos() { }

    public record RuleUpdateRequest(
            @NotNull @Digits(integer = 6, fraction = 2) BigDecimal threshold) { }

    public record RuleDto(String deviceCode, String deviceName, String sensor,
            BigDecimal threshold, boolean active, BigDecimal latestValue,
            LocalDateTime measuredAt) { }

    public record DailyPoint(LocalDate date, long LED1, long LED2, long LED3) { }

    public record DeviceTotal(String deviceCode, String deviceName, long today, long total) { }

    public record StatisticsDto(int days, LocalDate from, LocalDate to, long today,
            long total, BigDecimal averagePerDay, List<DeviceTotal> devices,
            List<DailyPoint> daily) { }
}
