package iot.com.BE.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class MqttMessageHandler {
    private static final Logger logger = LoggerFactory.getLogger(MqttMessageHandler.class);

    private final String sensorTopic;
    private final String statusTopic;
    private final SensorService sensorService;
    private final DeviceService deviceService;

    public MqttMessageHandler(
            @Value("${app.mqtt.sensor-topic:iot/sensors/data}") String sensorTopic,
            @Value("${app.mqtt.status-topic:iot/devices/status}") String statusTopic,
            SensorService sensorService,
            DeviceService deviceService) {
        this.sensorTopic = sensorTopic;
        this.statusTopic = statusTopic;
        this.sensorService = sensorService;
        this.deviceService = deviceService;
    }

    @EventListener
    public void handle(MqttInboundEvent event) {
        if (sensorTopic.equals(event.topic())) {
            sensorService.acceptMqttPayload(event.payload());
        } else if (statusTopic.equals(event.topic())) {
            deviceService.acceptMqttStatus(event.payload());
        } else {
            logger.warn("Ignoring MQTT message on unexpected topic {}", event.topic());
        }
    }
}
