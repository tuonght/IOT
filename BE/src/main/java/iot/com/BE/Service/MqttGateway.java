package iot.com.BE.Service;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MqttGateway {
    private static final Logger logger = LoggerFactory.getLogger(MqttGateway.class);

    private final ApplicationEventPublisher events;
    private final String brokerUri;
    private final String username;
    private final String password;
    private final String sensorTopic;
    private final String statusTopic;
    private final String controlTopic;
    private MqttClient client;

    public MqttGateway(
            ApplicationEventPublisher events,
            @Value("${app.mqtt.broker-uri:}") String brokerUri,
            @Value("${app.mqtt.username:}") String username,
            @Value("${app.mqtt.password:}") String password,
            @Value("${app.mqtt.sensor-topic:iot/sensors/data}") String sensorTopic,
            @Value("${app.mqtt.status-topic:iot/devices/status}") String statusTopic,
            @Value("${app.mqtt.control-topic:iot/devices/control}") String controlTopic) {
        this.events = events;
        this.brokerUri = brokerUri;
        this.username = username;
        this.password = password;
        this.sensorTopic = sensorTopic;
        this.statusTopic = statusTopic;
        this.controlTopic = controlTopic;
    }

    @PostConstruct
    public void initialize() {
        if (brokerUri.isBlank()) {
            logger.warn("MQTT is disabled: set MQTT_BROKER_URI to enable the broker connection.");
            return;
        }
        connectIfNeeded();
    }

    @Scheduled(fixedDelayString = "${app.mqtt.reconnect-delay-ms:5000}")
    public synchronized void connectIfNeeded() {
        if (brokerUri.isBlank() || (client != null && client.isConnected())) {
            return;
        }
        try {
            if (client == null) {
                client = new MqttClient(
                        brokerUri, "iot-backend-" + UUID.randomUUID(), new MemoryPersistence());
                client.setCallback(new org.eclipse.paho.client.mqttv3.MqttCallback() {
                    @Override
                    public void connectionLost(Throwable cause) {
                        logger.warn("MQTT connection lost: {}", cause.getMessage());
                    }

                    @Override
                    public void messageArrived(String topic, MqttMessage message) {
                        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
                        try {
                            events.publishEvent(new MqttInboundEvent(topic, payload));
                        } catch (RuntimeException exception) {
                            logger.error("Could not process MQTT message on {}: {}", topic,
                                    exception.getMessage());
                        }
                    }

                    @Override
                    public void deliveryComplete(
                            org.eclipse.paho.client.mqttv3.IMqttDeliveryToken token) {
                    }
                });
            }
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            options.setConnectionTimeout(5);
            if (!username.isBlank()) {
                options.setUserName(username);
                options.setPassword(password.toCharArray());
            }
            client.connect(options);
            client.subscribe(sensorTopic, 1);
            client.subscribe(statusTopic, 1);
            logger.info("Connected to MQTT broker {}; subscribed to sensor and status topics", brokerUri);
        } catch (MqttException exception) {
            logger.error("Unable to connect/subscribe to MQTT broker {}: {}", brokerUri,
                    exception.getMessage());
        }
    }

    public synchronized void publishControl(String message) {
        if (client == null || !client.isConnected()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "MQTT broker is disconnected; device command was not sent.");
        }
        try {
            MqttMessage mqttMessage = new MqttMessage(message.getBytes(StandardCharsets.UTF_8));
            mqttMessage.setQos(1);
            client.publish(controlTopic, mqttMessage);
        } catch (MqttException exception) {
            logger.error("Failed to publish MQTT control command: {}", exception.getMessage());
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Could not publish device command to MQTT.");
        }
    }

    @PreDestroy
    public synchronized void close() {
        if (client == null || !client.isConnected()) {
            return;
        }
        try {
            client.disconnect();
            client.close();
        } catch (MqttException exception) {
            logger.warn("Error while closing MQTT client: {}", exception.getMessage());
        }
    }
}
