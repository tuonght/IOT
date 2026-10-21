package iot.com.BE.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

import jakarta.persistence.criteria.Predicate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import iot.com.BE.Dto.ApiDtos.ChartPointDto;
import iot.com.BE.Dto.ApiDtos.PagedResponse;
import iot.com.BE.Dto.ApiDtos.SensorDataDto;
import iot.com.BE.Dto.ApiDtos.SensorLatestDto;
import iot.com.BE.Entity.Sensor;
import iot.com.BE.Entity.SensorData;
import iot.com.BE.Repository.SensorDataRepository;
import iot.com.BE.Repository.SensorRepository;
import iot.com.BE.Util.TimeSearchRange;

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
    private final SimpMessagingTemplate messagingTemplate;
    // Hàm khởi tạo
    public SensorService(
            ObjectMapper objectMapper,
            SensorRepository sensors,
            SensorDataRepository readings,
            SimpMessagingTemplate messagingTemplate) {
        this.objectMapper = objectMapper;
        this.sensors = sensors;
        this.readings = readings;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    // Hàm xử lý dữ liệu MQTT từ payload
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
            messagingTemplate.convertAndSend(
                    "/topic/sensors/live",
                    new ChartPointDto(measuredAt, temperature, humidity, light));
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
    public Map<String, BigDecimal> chartMaxima() {
        Map<String, BigDecimal> maxima = new LinkedHashMap<>();
        SENSOR_LABELS.keySet().forEach(sensor -> maxima.put(sensor, BigDecimal.ZERO));
        for (Object[] result : readings.findMaximumValuesBySensorCode()) {
            String sensor = (String) result[0];
            if (maxima.containsKey(sensor)) {
                maxima.put(sensor, (BigDecimal) result[1]);
            }
        }
        return maxima;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> chart(String sensor) {
        String normalizedSensor = sensor == null ? "all" : sensor.trim().toLowerCase(Locale.ROOT);
        if (!normalizedSensor.equals("all") && !SENSOR_LABELS.containsKey(normalizedSensor)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Loại cảm biến phải là all, temperature, humidity hoặc light.");
        }

        if (!normalizedSensor.equals("all")) {
            return readings.findAllBySensor_CodeOrderByMeasuredAtDesc(
                            normalizedSensor, PageRequest.of(0, 15))
                    .stream()
                    .map(reading -> chartPointForSensor(reading, normalizedSensor))
                    .sorted(java.util.Comparator.comparing(
                            point -> (LocalDateTime) point.get("time")))
                    .toList();
        }

        List<SensorData> recent = readings.findAllByOrderByMeasuredAtDesc(PageRequest.of(0, 1500));
        Map<LocalDateTime, Map<String, BigDecimal>> points = new TreeMap<>();
        for (SensorData reading : recent) {
            String code = reading.getSensor().getCode();
            if (SENSOR_LABELS.containsKey(code)) {
                points.computeIfAbsent(reading.getMeasuredAt(), ignored -> new LinkedHashMap<>())
                        .put(code, reading.getValue());
            }
        }

        return points.entrySet().stream()
                .skip(Math.max(0, points.size() - 15))
                .map(entry -> {
                    Map<String, BigDecimal> values = entry.getValue();
                    Map<String, Object> point = new LinkedHashMap<>();
                    point.put("time", entry.getKey());
                    point.put("temperature", values.get("temperature"));
                    point.put("humidity", values.get("humidity"));
                    point.put("light", values.get("light"));
                    return point;
                })
                .toList();
    }

    private Map<String, Object> chartPointForSensor(SensorData reading, String sensor) {
        Map<String, Object> point = new LinkedHashMap<>();
        point.put("time", reading.getMeasuredAt());
        point.put(sensor, reading.getValue());
        return point;
    }
    //
    @Transactional(readOnly = true)
    public PagedResponse<SensorDataDto> searchReadings(
            String type, String query, String sortOrder, int page, int size) {
        validatePage(page, size);
        String normalizedType = type == null ? "all" : type.trim().toLowerCase(Locale.ROOT);
        String normalizedQuery = query == null
                ? ""
                : query.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        Sort sort = sensorSort(sortOrder);
        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<SensorData> specification = sensorSpecification(normalizedType, normalizedQuery);
        Page<SensorData> result = readings.findAll(specification, pageable);
        return new PagedResponse<>(
                result.getContent().stream().map(this::toSensorDataDto).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }
    // Tạo điều kiện tìm kiếm cho cảm biến
    private Specification<SensorData> sensorSpecification(String type, String query) {
        if (!type.equals("all") && !type.equals("time")
                && !type.equals("nhiệt độ") && !type.equals("temperature")
                && !type.equals("độ ẩm") && !type.equals("humidity")
                && !type.equals("ánh sáng") && !type.equals("light")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại cảm biến không hợp lệ.");
        }

        var timeRange = TimeSearchRange.parse(query);
        return (root, criteriaQuery, criteriaBuilder) -> {
            var sensor = root.join("sensor");
            List<Predicate> predicates = new ArrayList<>();
            String sensorCode = switch (type) {
                case "nhiệt độ", "temperature" -> "temperature";
                case "độ ẩm", "humidity" -> "humidity";
                case "ánh sáng", "light" -> "light";
                default -> null;
            };
            if (sensorCode != null) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(sensor.get("code")), sensorCode));
            }

            if (!query.isBlank()) {
                String pattern = "%" + query + "%";
                jakarta.persistence.criteria.Predicate timeMatch;
                if (timeRange.isPresent()) {
                    TimeSearchRange range = timeRange.get();
                    var measuredAt = root.<LocalDateTime>get("measuredAt");
                    timeMatch = criteriaBuilder.and(
                            criteriaBuilder.greaterThanOrEqualTo(measuredAt, range.startInclusive()),
                            criteriaBuilder.lessThan(measuredAt, range.endExclusive()));
                } else {
                    var measuredAt = criteriaBuilder.function(
                            "date_format",
                            String.class,
                            root.get("measuredAt"),
                            criteriaBuilder.literal("%Y-%m-%d %H:%i:%s"));
                    timeMatch = criteriaBuilder.like(measuredAt, pattern);
                }
                if (type.equals("time")) {
                    predicates.add(timeMatch);
                } else {
                    var displayValue = criteriaBuilder.concat(
                            criteriaBuilder.concat(root.get("value").as(String.class), " "),
                            sensor.get("unit"));
                    if (sensorCode != null) {
                        predicates.add(criteriaBuilder.like(
                                criteriaBuilder.lower(displayValue), pattern));
                    } else {
                        predicates.add(criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(sensor.get("name")), pattern),
                                criteriaBuilder.like(criteriaBuilder.lower(sensor.get("code")), pattern),
                                criteriaBuilder.like(criteriaBuilder.lower(displayValue), pattern),
                                timeMatch));
                    }
                }
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Sort sensorSort(String sortOrder) {
        String normalized = sortOrder == null ? "" : sortOrder.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return Sort.by(Sort.Order.desc("measuredAt"), Sort.Order.desc("id"));
        }
        if (normalized.equals("asc")) {
            return Sort.by(Sort.Order.asc("value"), Sort.Order.desc("measuredAt"), Sort.Order.desc("id"));
        }
        if (normalized.equals("desc")) {
            return Sort.by(Sort.Order.desc("value"), Sort.Order.desc("measuredAt"), Sort.Order.desc("id"));
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Thứ tự sắp xếp phải là asc hoặc desc.");
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Trang phải từ 0 và kích thước trang từ 1 đến 100.");
        }
    }
    // Chuyển đổi đối tượng SensorData thành SensorDataDto
    private SensorDataDto toSensorDataDto(SensorData reading) {
        String code = reading.getSensor().getCode();
        String label = SENSOR_LABELS.getOrDefault(code, reading.getSensor().getName());
        return new SensorDataDto(
                reading.getId(),
                label,
                reading.getValue().toPlainString() + " " + reading.getSensor().getUnit(),
                reading.getMeasuredAt());
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
    // Lấy dữ liệu mới nhất của cảm biến theo mã code
    private SensorData latestFor(String code) {
        return readings.findTopBySensor_CodeOrderByMeasuredAtDesc(code).orElse(null);
    }
    // Lấy giá trị của cảm biến từ đối tượng SensorData
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
