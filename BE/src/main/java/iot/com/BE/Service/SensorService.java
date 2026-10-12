package iot.com.BE.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.*;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.*;

import iot.com.BE.Dto.ApiDtos.ChartPointDto;
import iot.com.BE.Dto.ApiDtos.SensorDataDto;
import iot.com.BE.Dto.ApiDtos.SensorLatestDto;
import iot.com.BE.Entity.Sensor;
import iot.com.BE.Entity.SensorData;
import iot.com.BE.Repository.SensorDataRepository;
import iot.com.BE.Repository.SensorRepository;

@Service
public class SensorService {
    private static final Logger logger = LoggerFactory.getLogger(SensorService.class);
    private static final DateTimeFormatter DEVICE_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Map<String, String> SENSOR_LABELS = Map.of(
            "temperature", "Nhiệt độ",
            "humidity", "Độ ẩm",
            "light", "Ánh sáng");

    private final ObjectMapper objectMapper;
    private final SensorRepository sensors;
    private final SensorDataRepository readings;

    public SensorService(
            ObjectMapper objectMapper,
            SensorRepository sensors,
            SensorDataRepository readings) {
        this.objectMapper = objectMapper;
        this.sensors = sensors;
        this.readings = readings;
    }

    @Transactional
    public void acceptMqttPayload(String payload) {
        try {
            JsonNode body = objectMapper.readTree(payload);
            BigDecimal temperature = requireNumber(body, "temperature");
            BigDecimal humidity = requireNumber(body, "humidity");
            BigDecimal light = requireNumber(body, "light");
            LocalDateTime measuredAt = parseDeviceTime(body.path("timestamp").asText(null));

            saveReading("temperature", temperature, measuredAt);
            saveReading("humidity", humidity, measuredAt);
            saveReading("light", light, measuredAt);
        } catch (Exception exception) {
            logger.warn("Discarded invalid MQTT sensor payload: {}", exception.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public SensorLatestDto latest() {
        SensorData temperature = latestFor("temperature");
        SensorData humidity = latestFor("humidity");
        SensorData light = latestFor("light");
        LocalDateTime updatedAt = null;
        for (SensorData reading : new SensorData[] { temperature, humidity, light }) {
            if (reading != null
                    && (updatedAt == null || reading.getMeasuredAt().isAfter(updatedAt))) {
                updatedAt = reading.getMeasuredAt();
            }
        }
        return new SensorLatestDto(
                valueOf(temperature), valueOf(humidity), valueOf(light), updatedAt);
    }

    @Transactional(readOnly = true)
    public List<ChartPointDto> chart() {
        List<SensorData> recent = readings.findAllByOrderByMeasuredAtDesc(PageRequest.of(0, 1500));
        Map<LocalDateTime, Map<String, BigDecimal>> points = new TreeMap<>();
        for (SensorData reading : recent) {
            String code = reading.getSensor().getCode();
            if (SENSOR_LABELS.containsKey(code)) {
                points.computeIfAbsent(reading.getMeasuredAt(), ignored -> new LinkedHashMap<>())
                        .put(code, reading.getValue());
            }
        }

        List<ChartPointDto> result = new ArrayList<>();
        points.forEach((time, values) -> result.add(new ChartPointDto(
                time, values.get("temperature"), values.get("humidity"), values.get("light"))));
        return result;
    }

    @Transactional(readOnly = true)
    public List<SensorDataDto> recentReadings() {
        return readings.findAllByOrderByMeasuredAtDesc(PageRequest.of(0, 500)).stream()
                .map(reading -> {
                    String code = reading.getSensor().getCode();
                    String label = SENSOR_LABELS.getOrDefault(code, reading.getSensor().getName());
                    return new SensorDataDto(
                            reading.getId(),
                            label,
                            reading.getValue().toPlainString() + " " + reading.getSensor().getUnit(),
                            reading.getMeasuredAt());
                })
                .toList();
    }

    private void saveReading(String code, BigDecimal value, LocalDateTime measuredAt) {
        Sensor sensor = sensors.findByCode(code).orElseThrow(() ->
                new IllegalStateException("Sensor configuration is missing: " + code));
        SensorData reading = new SensorData();
        reading.setSensor(sensor);
        reading.setValue(value);
        reading.setMeasuredAt(measuredAt);
        readings.save(reading);
    }

    private SensorData latestFor(String code) {
        return readings.findTopBySensor_CodeOrderByMeasuredAtDesc(code).orElse(null);
    }

    private BigDecimal valueOf(SensorData reading) {
        return reading == null ? null : reading.getValue();
    }

    private BigDecimal requireNumber(JsonNode body, String property) {
        JsonNode value = body.get(property);
        if (value == null || !value.isNumber()) {
            throw new IllegalArgumentException("Expected numeric property: " + property);
        }
        return value.decimalValue();
    }

    private LocalDateTime parseDeviceTime(String value) {
        if (value == null || value.isBlank() || "N/A".equals(value)) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(value, DEVICE_TIME);
        } catch (DateTimeParseException exception) {
            try {
                return LocalDateTime.parse(value);
            } catch (DateTimeParseException ignored) {
                logger.warn("Invalid sensor timestamp '{}'; using broker receive time", value);
                return LocalDateTime.now();
            }
        }
    }
}
