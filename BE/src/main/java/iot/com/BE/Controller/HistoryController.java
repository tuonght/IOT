package iot.com.BE.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iot.com.BE.Dto.ApiDtos.HistoryDto;
import iot.com.BE.Dto.ApiDtos.PagedResponse;
import iot.com.BE.Service.DeviceService;

@RestController
@RequestMapping("/api/history")
public class HistoryController {
    private final DeviceService deviceService;

    public HistoryController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }
    // API tìm kiếm
    @GetMapping
    public PagedResponse<HistoryDto> searchHistory(
            @RequestParam(defaultValue = "") String device,
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String time,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return deviceService.searchHistory(device, action, status, time, page, size);
    }

    @GetMapping("/devices")
    public java.util.List<String> historyDevices() {
        return deviceService.historyDevices();
    }
}
