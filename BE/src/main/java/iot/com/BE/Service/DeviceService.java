package iot.com.BE.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import iot.com.BE.Dto.*;        
import iot.com.BE.Dto.ApiDtos.*;
import iot.com.BE.Entity.*;
import iot.com.BE.Repository.*;
@Service
public class DeviceService {
    private static final Logger logger = LoggerFactory.getLogger(DeviceService.class);
    private static final int COMMAND_TIMEOUT_SECONDS = 15;

    private final DeviceRepository devices;
    private final HistoryRepository histories;
    private final UserRepository users;
    private final MqttGateway mqtt;
    private final ObjectMapper objectMapper;

    public DeviceService(
            DeviceRepository devices,
            HistoryRepository histories,
            UserRepository users,
            MqttGateway mqtt,
            ObjectMapper objectMapper) {
        this.devices = devices;
        this.histories = histories;
        this.users = users;
        this.mqtt = mqtt;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<DeviceDto> devices() {
        return devices.findAll().stream()
                .map(device -> new DeviceDto(
                        device.getId(), device.getCode(), device.getName(), device.getCurrentStatus()))
                .toList();
    }

    @Transactional
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

            histories.findFirstByDevice_IdAndActionAndStatusOrderByRequestedAtDesc(
                            device.getId(), status, ActionStatus.LOADING)
                    .ifPresent(history -> {
                        history.setStatus(ActionStatus.SUCCESS);
                        history.setCompletedAt(LocalDateTime.now());
                        histories.save(history);
                    });
        } catch (Exception exception) {
            logger.warn("Discarded invalid MQTT device status payload: {}", exception.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<HistoryDto> history() {
        return histories.findAllByOrderByRequestedAtDesc().stream()
                .map(this::toHistoryDto)
                .toList();
    }

    @Scheduled(fixedDelay = 5000)
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
        }
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
