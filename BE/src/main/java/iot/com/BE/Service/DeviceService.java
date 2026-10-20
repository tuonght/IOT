package iot.com.BE.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import iot.com.BE.Dto.ApiDtos.DeviceDto;
import iot.com.BE.Dto.ApiDtos.DeviceStatusUpdateDto;
import iot.com.BE.Dto.ApiDtos.HistoryDto;
import iot.com.BE.Dto.ApiDtos.PagedResponse;
import iot.com.BE.Entity.ActionStatus;
import iot.com.BE.Entity.Device;
import iot.com.BE.Entity.History;
import iot.com.BE.Repository.DeviceRepository;
import iot.com.BE.Repository.HistoryRepository;
import iot.com.BE.Repository.UserRepository;
import iot.com.BE.Util.TimeSearchRange;

@Service
public class DeviceService {
    private static final Logger logger = LoggerFactory.getLogger(DeviceService.class);
    private static final int COMMAND_TIMEOUT_SECONDS = 10;

    private final DeviceRepository devices;
    private final HistoryRepository histories;
    private final UserRepository users;
    private final MqttGateway mqtt;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public DeviceService(
            DeviceRepository devices,
            HistoryRepository histories,
            UserRepository users,
            MqttGateway mqtt,
            ObjectMapper objectMapper,
            SimpMessagingTemplate messagingTemplate) {
        this.devices = devices;
        this.histories = histories;
        this.users = users;
        this.mqtt = mqtt;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<DeviceDto> devices() {
        return devices.findAll().stream()
                .map(device -> new DeviceDto(
                        device.getId(), device.getCode(), device.getName(), device.getCurrentStatus()))
                .toList();
    }

    public HistoryDto command(Long id, String action, String userEmail) {
        String normalizedAction = action == null ? "" : action.trim().toUpperCase(Locale.ROOT);
        if (!normalizedAction.equals("ON") && !normalizedAction.equals("OFF")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Action must be ON or OFF.");
        }

        Device device = devices.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Device not found."));
        if (!device.getCode().matches("LED[1-3]")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only LED1, LED2, and LED3 support MQTT commands.");
        }

        History history = new History();
        history.setDevice(device);
        history.setAction(normalizedAction);
        history.setStatus(ActionStatus.LOADING);
        history.setRequestedAt(LocalDateTime.now());
        if (userEmail != null && !userEmail.isBlank()) {
            users.findByEmailIgnoreCase(userEmail.trim()).ifPresent(history::setUser);
        }
        history = histories.save(history);

        try {
            mqtt.publishControl(device.getCode() + "_" + normalizedAction);
        } catch (ResponseStatusException exception) {
            history.setStatus(ActionStatus.FAILED);
            history.setCompletedAt(LocalDateTime.now());
            histories.save(history);
            throw exception;
        }
        return toHistoryDto(history);
    }

    @Transactional
    public void acceptMqttStatus(String payload) {
        try {
            JsonNode body = objectMapper.readTree(payload);
            String rawDevice = body.path("device").asText("");
            String code = rawDevice.trim().split("\\s+")[0].toUpperCase(Locale.ROOT);
            String rawStatus = body.path("status").asText("");
            if (rawStatus.isBlank()) {
                String[] parts = rawDevice.trim().split("\\s+");
                rawStatus = parts.length > 1 ? parts[1] : "";
            }

            String status = rawStatus.trim().toUpperCase(Locale.ROOT);
            if (!status.equals("ON") && !status.equals("OFF")) {
                logger.warn("Ignoring MQTT device status with invalid status '{}'", rawStatus);
                return;
            }

            Device device = devices.findByCode(code).orElse(null);
            if (device == null) {
                logger.warn("Ignoring MQTT status for unknown device '{}'", code);
                return;
            }
            device.setCurrentStatus(status);
            devices.save(device);

            var pendingCommand = histories.findFirstByDevice_IdAndStatusOrderByRequestedAtDesc(
                    device.getId(), ActionStatus.LOADING);
            if (pendingCommand.isPresent()) {
                History history = pendingCommand.get();
                boolean succeeded = history.getAction().equals(status);
                history.setStatus(succeeded ? ActionStatus.SUCCESS : ActionStatus.FAILED);
                history.setCompletedAt(LocalDateTime.now());
                histories.save(history);
                publishDeviceStatus(device, succeeded, history.getAction());
            } else {
                publishDeviceStatus(device);
            }
        } catch (Exception exception) {
            logger.warn("Discarded invalid MQTT device status payload: {}", exception.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PagedResponse<HistoryDto> searchHistory(
            String device, String action, String status, String time, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Trang phải từ 0 và kích thước trang từ 1 đến 100.");
        }

        ActionStatus normalizedStatus = parseStatus(status);
        String normalizedDevice = device == null ? "" : device.trim().toLowerCase(Locale.ROOT);
        String normalizedAction = action == null ? "" : action.trim().toUpperCase(Locale.ROOT);
        String normalizedTime = time == null ? "" : time.trim().replaceAll("\\s+", " ");
        var timeRange = TimeSearchRange.parse(normalizedTime);
        if (!normalizedAction.isBlank()
                && !normalizedAction.equals("ON")
                && !normalizedAction.equals("OFF")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hành động phải là ON hoặc OFF.");
        }

        Specification<History> specification = (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!normalizedDevice.isBlank()) {
                predicates.add(criteriaBuilder.equal(
                        criteriaBuilder.lower(root.join("device").get("name")), normalizedDevice));
            }
            if (!normalizedAction.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("action"), normalizedAction));
            }
            if (normalizedStatus != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), normalizedStatus));
            }
            if (!normalizedTime.isBlank()) {
                if (timeRange.isPresent()) {
                    TimeSearchRange range = timeRange.get();
                    var requestedAt = root.<LocalDateTime>get("requestedAt");
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                            requestedAt, range.startInclusive()));
                    predicates.add(criteriaBuilder.lessThan(
                            requestedAt, range.endExclusive()));
                } else {
                    var requestedAt = criteriaBuilder.function(
                            "date_format",
                            String.class,
                            root.get("requestedAt"),
                            criteriaBuilder.literal("%Y-%m-%d %H:%i:%s"));
                    predicates.add(criteriaBuilder.like(
                            requestedAt, "%" + normalizedTime.toLowerCase(Locale.ROOT) + "%"));
                }
            }
            return criteriaBuilder.and(
                    predicates.toArray(Predicate[]::new));
        };

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.desc("requestedAt"), Sort.Order.desc("id")));
        Page<History> result = histories.findAll(specification, pageable);
        return new PagedResponse<>(
                result.getContent().stream().map(this::toHistoryDto).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<String> historyDevices() {
        return histories.findDistinctDeviceNames();
    }

    private ActionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return ActionStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Trạng thái phải là SUCCESS, FAILED hoặc LOADING.");
        }
    }

    @Scheduled(fixedDelay = 250)
    @Transactional
    public void failTimedOutCommands() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(COMMAND_TIMEOUT_SECONDS);
        List<History> expired = histories.findAllByStatusAndRequestedAtBefore(
                ActionStatus.LOADING, cutoff);
        for (History history : expired) {
            history.setStatus(ActionStatus.FAILED);
            history.setCompletedAt(LocalDateTime.now());
        }
        if (!expired.isEmpty()) {
            histories.saveAll(expired);
            expired.forEach(history ->
                    publishDeviceStatus(
                            history.getDevice(), false, history.getAction()));
        }
    }

    private void publishDeviceStatus(Device device) {
        publishDeviceStatus(device, null);
    }

    private void publishDeviceStatus(Device device, Boolean commandSucceeded) {
        publishDeviceStatus(device, commandSucceeded, null);
    }

    private void publishDeviceStatus(
            Device device, Boolean commandSucceeded, String commandAction) {
        DeviceStatusUpdateDto update = new DeviceStatusUpdateDto(
                device.getId(), device.getCurrentStatus(), commandSucceeded, commandAction);
        messagingTemplate.convertAndSend("/topic/devices/" + device.getId() + "/status", update);
    }

    private HistoryDto toHistoryDto(History history) {
        String performedBy = history.getUser() == null ? "—" : history.getUser().getUsername();
        return new HistoryDto(
                history.getId(),
                history.getDevice().getName(),
                performedBy,
                history.getAction(),
                history.getStatus().name(),
                history.getRequestedAt());
    }
}
