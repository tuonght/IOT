package iot.com.BE.Service;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.AopTestUtils;
import org.springframework.transaction.annotation.Transactional;

import iot.com.BE.Repository.DeviceAlertEventRepository;
import iot.com.BE.Repository.DeviceAlertRuleRepository;
import iot.com.BE.Repository.HistoryRepository;

@SpringBootTest(properties = "app.mqtt.broker-uri=")
@Transactional
class DeviceAlertDatabaseTests {
    @Autowired private DeviceAlertService service;
    @Autowired private DeviceAlertRuleRepository rules;
    @Autowired private DeviceAlertEventRepository alerts;
    @Autowired private HistoryRepository history;
    @Autowired private EntityManager entityManager;

    @Test
    void mysqlPersistsAndAggregatesSamplesWithoutChangingCommandHistory() {
        long originalHistory = history.count();
        long originalEvents = alerts.count();
        long originalTotal = service.statistics(1).total();
        String[] sensors = { "humidity", "light", "temperature" };
        String[] thresholds = { "50.5", "3500", "28" };
        var configured = rules.findAllByOrderByDeviceCodeAsc();
        for (int index = 0; index < configured.size(); index++) {
            configured.get(index).setSensorCode(sensors[index]);
            configured.get(index).setThreshold(new BigDecimal(thresholds[index]));
            configured.get(index).setMeasuredAt(null);
        }
        entityManager.flush();
        // Bypass REQUIRES_NEW only in this test, so every test write rolls back.
        DeviceAlertService target = AopTestUtils.getTargetObject(service);
        var time = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).atTime(1, 2, 3, 123456000);
        target.evaluate(new SensorSampleReceived(time, new BigDecimal("29"), new BigDecimal("60"), new BigDecimal("4000")));
        target.evaluate(new SensorSampleReceived(time, new BigDecimal("29"), new BigDecimal("60"), new BigDecimal("4000")));
        target.evaluate(new SensorSampleReceived(time.plusSeconds(5), new BigDecimal("28"), new BigDecimal("50.5"), new BigDecimal("3500")));
        entityManager.flush();

        assertEquals(originalEvents + 3, alerts.count());
        assertEquals(originalTotal + 3, service.statistics(1).total());
        assertEquals(originalHistory, history.count());
        assertTrue(service.list().stream().noneMatch(rule -> rule.active()));
        assertEquals(7, service.statistics(7).daily().size());
        assertEquals(30, service.statistics(30).daily().size());
    }
}
