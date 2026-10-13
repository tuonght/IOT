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
import jakarta.servlet.http.HttpServletRequest;
import iot.com.BE.Dto.ApiDtos.DeviceActionRequest;
import iot.com.BE.Dto.ApiDtos.DeviceDto;
import iot.com.BE.Dto.ApiDtos.HistoryDto;
import iot.com.BE.Service.AuthenticatedUserService;
import iot.com.BE.Service.DeviceService;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {
    private final DeviceService deviceService;
    private final AuthenticatedUserService authenticatedUserService;

    public DeviceController(
            DeviceService deviceService, AuthenticatedUserService authenticatedUserService) {
        this.deviceService = deviceService;
        this.authenticatedUserService = authenticatedUserService;
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
            HttpServletRequest httpRequest) {
        return deviceService.command(
                id, request.action(), authenticatedUserService.requireEmail(httpRequest));
    }
}
