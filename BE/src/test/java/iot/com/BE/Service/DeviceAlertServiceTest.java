package iot.com.BE.Service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.server.ResponseStatusException;

import iot.com.BE.Dto.DeviceAlertDtos.RuleUpdateRequest;
import iot.com.BE.Entity.DeviceAlertEvent;
import iot.com.BE.Entity.DeviceAlertRule;
import iot.com.BE.Repository.DeviceAlertEventRepository;
import iot.com.BE.Repository.DeviceAlertRuleRepository;

class DeviceAlertServiceTest {
    private final DeviceAlertRuleRepository rules = mock(DeviceAlertRuleRepository.class);
    private final DeviceAlertEventRepository alerts = mock(DeviceAlertEventRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final DeviceAlertService service = new DeviceAlertService(rules, alerts, events);
    private final LocalDateTime time = LocalDateTime.of(2026, 10, 28, 14, 0);
    private List<DeviceAlertRule> configured;

    @BeforeEach
    void setup() {
        configured = List.of(rule("LED1", "humidity", "50.5"),
                rule("LED2", "light", "3500"), rule("LED3", "temperature", "28"));
        when(rules.findAllForUpdate()).thenReturn(configured);
        when(rules.findAllByOrderByDeviceCodeAsc()).thenReturn(configured);
    }

    @Test
    void strictThresholdAndIndependentSensors() {
        service.evaluate(sample(time, "28", "50.5", "3500"));
        assertTrue(configured.stream().noneMatch(DeviceAlertRule::isActive));
        verify(alerts, never()).save(any());

        service.evaluate(sample(time.plusSeconds(5), "28.1", "50.51", "3501"));
        assertTrue(configured.stream().allMatch(DeviceAlertRule::isActive));
        verify(alerts, times(3)).save(any(DeviceAlertEvent.class));
    }

    @Test
    void eachNewHighSampleCountsButDuplicatesAndOlderSamplesDoNot() {
        service.evaluate(sample(time, "29", "40", "1000"));
        service.evaluate(sample(time.plusSeconds(5), "30", "40", "1000"));
        service.evaluate(sample(time.plusSeconds(5), "30", "40", "1000"));
        service.evaluate(sample(time.minusSeconds(5), "31", "70", "4000"));
        verify(alerts, times(2)).save(any());
        assertEquals(new BigDecimal("30"), configured.get(2).getLatestValue());
    }

    @Test
    void fallingSampleStopsWarningWithoutCreatingAnotherAlert() {
        service.evaluate(sample(time, "29", "60", "4000"));
        service.evaluate(sample(time.plusSeconds(5), "28", "50.5", "3500"));
        assertTrue(configured.stream().noneMatch(DeviceAlertRule::isActive));
        verify(alerts, times(3)).save(any());
    }

    @Test
    void thresholdUpdatePreservesFixedSensorAndWaitsForNextSample() {
        service.evaluate(sample(time, "29", "60", "1000"));
        when(rules.findForUpdate("LED1")).thenReturn(Optional.of(configured.get(0)));
        service.update("LED1", new RuleUpdateRequest(new BigDecimal("55")));
        assertEquals("humidity", configured.get(0).getSensorCode());
        assertFalse(configured.get(0).isActive());
        assertNull(configured.get(0).getLatestValue());
        assertEquals(time, configured.get(0).getMeasuredAt());
        clearInvocations(alerts);
        service.evaluate(sample(time.plusSeconds(5), "20", "54", "2500"));
        assertFalse(configured.get(0).isActive());
        service.evaluate(sample(time.plusSeconds(10), "20", "56", "0"));
        assertTrue(configured.get(0).isActive());
        assertFalse(configured.get(1).isActive());
        verify(alerts, times(1)).save(any());
    }

    @Test
    void rejectsInvalidConfigurationAndUnsupportedWindows() {
        assertThrows(ResponseStatusException.class, () -> service.update("LED4",
                new RuleUpdateRequest(BigDecimal.TEN)));
        assertThrows(ResponseStatusException.class, () -> service.update("LED1",
                new RuleUpdateRequest(new BigDecimal("100.01"))));
        assertThrows(ResponseStatusException.class, () -> service.update("LED1",
                new RuleUpdateRequest(new BigDecimal("-0.1"))));
        assertThrows(ResponseStatusException.class, () -> service.statistics(2));
        verify(rules, never()).save(any());
    }

    @Test
    void startupRestoresFixedSensorsWithoutOverwritingValidThresholds() {
        configured.get(0).setSensorCode("light");
        configured.get(0).setThreshold(new BigDecimal("3500"));
        configured.get(1).setThreshold(new BigDecimal("3900"));
        for (var rule : configured) {
            when(rules.findById(rule.getDeviceCode())).thenReturn(Optional.of(rule));
        }
        service.run(null);
        assertEquals("humidity", configured.get(0).getSensorCode());
        assertEquals(new BigDecimal("50.5"), configured.get(0).getThreshold());
        assertEquals("light", configured.get(1).getSensorCode());
        assertEquals(new BigDecimal("3900"), configured.get(1).getThreshold());
        assertEquals("temperature", configured.get(2).getSensorCode());
    }

    @Test
    void statisticsZeroFillsDaysSeparatesDevicesAndUsesInclusiveCalendarWindows() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        var rows = List.of(count(today.minusDays(1), "LED1", 2), count(today, "LED2", 3));
        when(alerts.countByDay(any(), any())).thenReturn(rows);
        var result = service.statistics(7);
        assertEquals(7, result.daily().size());
        assertEquals(today.minusDays(6), result.from());
        assertEquals(5, result.total());
        assertEquals(3, result.today());
        assertEquals(new BigDecimal("0.7"), result.averagePerDay());
        assertEquals(2, result.devices().get(0).total());
        assertEquals(3, result.devices().get(1).today());
        assertEquals(0, result.devices().get(2).total());
        assertEquals(0, result.daily().get(0).LED1());
        verify(alerts).countByDay(today.minusDays(6).atStartOfDay(), today.plusDays(1).atStartOfDay());
    }

    @Test
    void emptyStatisticsSupportsOneAndThirtyDays() {
        when(alerts.countByDay(any(), any())).thenReturn(List.of());
        assertEquals(1, service.statistics(1).daily().size());
        assertEquals(30, service.statistics(30).daily().size());
        assertEquals(0, service.statistics(30).total());
    }

    private DeviceAlertRule rule(String code, String sensor, String threshold) {
        DeviceAlertRule rule = new DeviceAlertRule();
        rule.setDeviceCode(code);
        rule.setSensorCode(sensor);
        rule.setThreshold(new BigDecimal(threshold));
        return rule;
    }

    private SensorSampleReceived sample(LocalDateTime at, String temperature, String humidity, String light) {
        return new SensorSampleReceived(at, new BigDecimal(temperature), new BigDecimal(humidity), new BigDecimal(light));
    }

    private DeviceAlertEventRepository.DailyCount count(LocalDate day, String code, long total) {
        var row = mock(DeviceAlertEventRepository.DailyCount.class);
        when(row.getDay()).thenReturn(day.toString());
        when(row.getDeviceCode()).thenReturn(code);
        when(row.getTotal()).thenReturn(total);
        return row;
    }
}
