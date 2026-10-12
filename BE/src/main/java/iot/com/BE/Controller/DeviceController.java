package iot.com.BE.Controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpSession;
import iot.com.BE.Dto.ApiDtos.DeviceActionRequest;
import iot.com.BE.Dto.ApiDtos.DeviceDto;
import iot.com.BE.Dto.ApiDtos.HistoryDto;
import iot.com.BE.Service.DeviceService;
import iot.com.BE.Service.SessionAuthService;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {
    private final DeviceService deviceService;
    private final SessionAuthService sessionAuthService;

    public DeviceController(DeviceService deviceService, SessionAuthService sessionAuthService) {
        this.deviceService = deviceService;
        this.sessionAuthService = sessionAuthService;
    }

    @GetMapping
    public List<DeviceDto> list() {
        return deviceService.devices();
    }

    @PostMapping("/{id}/actions")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public HistoryDto command(
            @PathVariable Long id,
            @Valid @RequestBody DeviceActionRequest request,
            HttpSession session) {
        return deviceService.command(
                id, request.action(), sessionAuthService.requireEmail(session));
    }
}
