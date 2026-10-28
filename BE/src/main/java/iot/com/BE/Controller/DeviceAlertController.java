package iot.com.BE.Controller;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import iot.com.BE.Dto.DeviceAlertDtos.RuleDto;
import iot.com.BE.Dto.DeviceAlertDtos.RuleUpdateRequest;
import iot.com.BE.Dto.DeviceAlertDtos.StatisticsDto;
import iot.com.BE.Service.DeviceAlertService;

@RestController
@RequestMapping("/api/device-alerts")
public class DeviceAlertController {
    private final DeviceAlertService alerts;

    public DeviceAlertController(DeviceAlertService alerts) { this.alerts = alerts; }

    @GetMapping
    public List<RuleDto> list() { return alerts.list(); }

    @PatchMapping("/{deviceCode}")
    public RuleDto update(@PathVariable String deviceCode, @Valid @RequestBody RuleUpdateRequest request) {
        return alerts.update(deviceCode, request);
    }

    @GetMapping("/statistics")
    public StatisticsDto statistics(@RequestParam(defaultValue = "7") int days) {
        return alerts.statistics(days);
    }
}
