package iot.com.BE.Service;

public record MqttInboundEvent(String topic, String payload) {
}
