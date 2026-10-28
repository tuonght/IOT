package iot.com.BE.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import iot.com.BE.Dto.DeviceAlertDtos.DailyPoint;
import iot.com.BE.Dto.DeviceAlertDtos.DeviceTotal;
import iot.com.BE.Dto.DeviceAlertDtos.RuleDto;
import iot.com.BE.Dto.DeviceAlertDtos.RuleUpdateRequest;
import iot.com.BE.Dto.DeviceAlertDtos.StatisticsDto;
import iot.com.BE.Entity.DeviceAlertEvent;
import iot.com.BE.Entity.DeviceAlertRule;
import iot.com.BE.Repository.DeviceAlertEventRepository;
import iot.com.BE.Repository.DeviceAlertRuleRepository;

@Service
public class DeviceAlertService implements ApplicationRunner {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Map<String, String> DEVICE_SENSORS = Map.of(
            "LED1", "humidity", "LED2", "light", "LED3", "temperature");
    private static final List<String> CODES = DEVICE_SENSORS.keySet().stream().sorted().toList();
    private final DeviceAlertRuleRepository rules;
    private final DeviceAlertEventRepository alerts;
    private final ApplicationEventPublisher events;

    public record RulesChanged(List<RuleDto> rules) { }

    public DeviceAlertService(DeviceAlertRuleRepository rules,
            DeviceAlertEventRepository alerts, ApplicationEventPublisher events) {
        this.rules = rules;
        this.alerts = alerts;
        this.events = events;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initializeRule("LED1", "50.5");
        initializeRule("LED2", "3500");
        initializeRule("LED3", "28");
    }

    private void initializeRule(String code, String threshold) {
        String sensor = DEVICE_SENSORS.get(code);
        DeviceAlertRule rule = rules.findById(code).orElse(null);
        if (rule == null) {
            rule = new DeviceAlertRule();
            rule.setDeviceCode(code);
            rule.setSensorCode(sensor);
            rule.setThreshold(new BigDecimal(threshold));
            rules.save(rule);
        } else if (!sensor.equals(rule.getSensorCode())) {
            rule.setSensorCode(sensor);
            try {
                validateThreshold(sensor, rule.getThreshold());
            } catch (ResponseStatusException exception) {
                rule.setThreshold(new BigDecimal(threshold));
            }
            rule.setActive(false);
            rule.setLatestValue(null);
            rules.save(rule);
        }
    }

    @Transactional(readOnly = true)
    public List<RuleDto> list() {
        return rules.findAllByOrderByDeviceCodeAsc().stream().map(this::toDto).toList();
    }

    @Transactional
    public RuleDto update(String deviceCode, RuleUpdateRequest request) {
        String code = deviceCode.toUpperCase(Locale.ROOT);
        if (!CODES.contains(code)) throw badRequest("Chỉ cấu hình cảnh báo cho LED1, LED2, LED3.");
        String sensor = DEVICE_SENSORS.get(code);
        BigDecimal threshold = request.threshold();
        validateThreshold(sensor, threshold);
        DeviceAlertRule rule = rules.findForUpdate(code).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Chưa có cấu hình cảnh báo."));
        if (!sensor.equals(rule.getSensorCode()) || threshold.compareTo(rule.getThreshold()) != 0) {
            rule.setSensorCode(sensor);
            rule.setThreshold(threshold);
            rule.setActive(false);
            rule.setLatestValue(null);
            // Keep the sample timestamp to prevent counting a retransmitted old sample.
        }
        rules.save(rule);
        events.publishEvent(new RulesChanged(list()));
        return toDto(rule);
    }

    private void validateThreshold(String sensor, BigDecimal threshold) {
        BigDecimal min;
        BigDecimal max;
        switch (sensor) {
            case "humidity" -> { min = BigDecimal.ZERO; max = new BigDecimal("100"); }
            case "light" -> { min = BigDecimal.ZERO; max = new BigDecimal("4095"); }
            case "temperature" -> { min = new BigDecimal("-40"); max = new BigDecimal("125"); }
            default -> throw badRequest("Cảm biến phải là humidity, light hoặc temperature.");
        }
        if (threshold == null || threshold.scale() > 2
                || threshold.compareTo(min) < 0 || threshold.compareTo(max) > 0) {
            throw badRequest("Ngưỡng phải từ " + min + " đến " + max + ", tối đa 2 chữ số thập phân.");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void evaluate(SensorSampleReceived sample) {
        List<DeviceAlertRule> currentRules = rules.findAllForUpdate();
        boolean changed = false;
        for (DeviceAlertRule rule : currentRules) {
            if (rule.getMeasuredAt() != null && !sample.measuredAt().isAfter(rule.getMeasuredAt())) {
                continue;
            }
            BigDecimal value = sample.valueFor(rule.getSensorCode());
            boolean active = value.compareTo(rule.getThreshold()) > 0;
            rule.setLatestValue(value);
            rule.setMeasuredAt(sample.measuredAt());
            rule.setActive(active);
            if (active) {
                DeviceAlertEvent event = new DeviceAlertEvent();
                event.setDeviceCode(rule.getDeviceCode());
                event.setSensorCode(rule.getSensorCode());
                event.setSensorValue(value);
                event.setThreshold(rule.getThreshold());
                event.setMeasuredAt(sample.measuredAt());
                alerts.save(event);
            }
            changed = true;
        }
        if (changed) {
            rules.saveAll(currentRules);
            events.publishEvent(new RulesChanged(currentRules.stream().map(this::toDto).toList()));
        }
    }

    @Transactional(readOnly = true)
    public StatisticsDto statistics(int days) {
        if (days != 1 && days != 7 && days != 30) throw badRequest("Số ngày phải là 1, 7 hoặc 30.");
        LocalDate today = LocalDate.now(ZONE);
        LocalDate from = today.minusDays(days - 1L);
        Map<LocalDate, Map<String, Long>> counts = new LinkedHashMap<>();
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            counts.put(day, new LinkedHashMap<>(Map.of("LED1", 0L, "LED2", 0L, "LED3", 0L)));
        }
        for (var row : alerts.countByDay(from.atStartOfDay(), today.plusDays(1).atStartOfDay())) {
            Map<String, Long> day = counts.get(LocalDate.parse(row.getDay()));
            if (day != null && CODES.contains(row.getDeviceCode())) day.put(row.getDeviceCode(), row.getTotal());
        }
        List<DeviceTotal> totals = new ArrayList<>();
        for (String code : CODES) {
            long total = counts.values().stream().mapToLong(day -> day.get(code)).sum();
            totals.add(new DeviceTotal(code, name(code), counts.get(today).get(code), total));
        }
        long total = totals.stream().mapToLong(DeviceTotal::total).sum();
        long todayTotal = totals.stream().mapToLong(DeviceTotal::today).sum();
        List<DailyPoint> daily = counts.entrySet().stream().map(entry -> new DailyPoint(
                entry.getKey(), entry.getValue().get("LED1"), entry.getValue().get("LED2"),
                entry.getValue().get("LED3"))).toList();
        return new StatisticsDto(days, from, today, todayTotal, total,
                BigDecimal.valueOf(total).divide(BigDecimal.valueOf(days), 1, RoundingMode.HALF_UP),
                totals, daily);
    }

    private RuleDto toDto(DeviceAlertRule rule) {
        return new RuleDto(rule.getDeviceCode(), name(rule.getDeviceCode()), rule.getSensorCode(),
                rule.getThreshold(), rule.isActive(), rule.getLatestValue(), rule.getMeasuredAt());
    }

    private String name(String code) { return "Đèn " + code.substring(3); }
    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
