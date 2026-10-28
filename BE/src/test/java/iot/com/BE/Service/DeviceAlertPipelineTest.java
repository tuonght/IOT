package iot.com.BE.Service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import iot.com.BE.Repository.HistoryRepository;
import iot.com.BE.Repository.SensorDataRepository;

// Opt in only after creating this dedicated, disposable database.
@EnabledIfEnvironmentVariable(named = "IOT_ALERT_PIPELINE_TEST", matches = "true")
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:mysql://localhost:3306/iot_alert_pipeline_test?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true",
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.mqtt.broker-uri="
})
class DeviceAlertPipelineTest {
    @Autowired private ApplicationEventPublisher events;
    @Autowired private DeviceAlertService alerts;
    @Autowired private DeviceService devices;
    @Autowired private HistoryRepository history;
    @Autowired private SensorDataRepository readings;
    @Autowired private PlatformTransactionManager transactions;

    @Test
    void realMqttHandlerCommitsSensorDataThenCountsAndClearsAlerts() {
        LocalDateTime time = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).withNano(0);
        publish(time, 27, 40, 3900);
        assertTrue(alerts.list().get(1).active(), "3900 > 3500 must activate LED2");
        assertFalse(alerts.list().get(0).active());
        assertFalse(alerts.list().get(2).active());
        assertEquals(1, alerts.statistics(1).total());

        publish(time, 27, 40, 3900);
        assertEquals(1, alerts.statistics(1).total(), "Duplicate sample must not increase count");
        publish(time.plusSeconds(5), 28, 50.5, 3500);
        assertTrue(alerts.list().stream().noneMatch(rule -> rule.active()), "Equality must stop blinking");
        assertEquals(1, alerts.statistics(1).total());

        publish(time.plusSeconds(10), 29, 51, 3901);
        assertTrue(alerts.list().stream().allMatch(rule -> rule.active()));
        for (int days : new int[] {1, 7, 30}) {
            var stats = alerts.statistics(days);
            assertEquals(4, stats.total());
            assertEquals(1, stats.devices().get(0).total());
            assertEquals(2, stats.devices().get(1).total());
            assertEquals(1, stats.devices().get(2).total());
        }
        assertEquals(12, readings.count());
        assertEquals(0, history.count(), "Visual alerts must never create command history");
        assertTrue(devices.devices().stream().allMatch(device -> device.status().equals("OFF")),
                "Visual alerts must not turn on hardware devices");

        new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
            publish(time.plusSeconds(15), 30, 70, 4000);
            transaction.setRollbackOnly();
        });
        assertEquals(12, readings.count());
        assertEquals(4, alerts.statistics(1).total(), "Rolled-back samples must not create alerts");
    }

    private void publish(LocalDateTime time, double temperature, double humidity, int light) {
        String payload = "{\"timestamp\":\"" + time.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                + "\",\"temperature\":" + temperature + ",\"humidity\":" + humidity + ",\"light\":" + light + "}";
        events.publishEvent(new MqttInboundEvent("iot/sensors/data", payload));
    }
}
