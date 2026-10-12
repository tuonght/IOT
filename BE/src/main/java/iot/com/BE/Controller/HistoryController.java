package iot.com.BE.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iot.com.BE.Dto.ApiDtos.HistoryDto;
import iot.com.BE.Service.DeviceService;

@RestController
@RequestMapping("/api/history")
public class HistoryController {
    private final DeviceService deviceService;

    public HistoryController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public List<HistoryDto> history() {
        return deviceService.history();
    }
}
