package iot.com.BE.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class DeviceAlertListener {
    private static final Logger logger = LoggerFactory.getLogger(DeviceAlertListener.class);
    private final DeviceAlertService alerts;
    private final SimpMessagingTemplate messaging;

    public DeviceAlertListener(DeviceAlertService alerts, SimpMessagingTemplate messaging) {
        this.alerts = alerts;
        this.messaging = messaging;
    }

    @TransactionalEventListener
    public void onSample(SensorSampleReceived sample) {
        // Alerts run only after sensor data commits, in their own transaction.
        try {
            alerts.evaluate(sample);
        } catch (RuntimeException exception) {
            logger.error("Could not evaluate device alerts: {}", exception.getMessage(), exception);
        }
    }

    @TransactionalEventListener
    public void onRulesChanged(DeviceAlertService.RulesChanged event) {
        try {
            messaging.convertAndSend("/topic/device-alerts", event.rules());
        } catch (RuntimeException exception) {
            logger.warn("Could not broadcast device alerts: {}", exception.getMessage());
        }
    }
}
