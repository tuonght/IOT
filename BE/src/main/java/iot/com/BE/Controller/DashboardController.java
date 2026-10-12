package iot.com.BE.Controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iot.com.BE.Dto.ApiDtos.ChartPointDto;
import iot.com.BE.Dto.ApiDtos.SensorLatestDto;
import iot.com.BE.Service.SensorService;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final SensorService sensorService;

    public DashboardController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping("/sensor-latest")
    public SensorLatestDto latest() {
        return sensorService.latest();
    }

    @GetMapping("/chart")
    public List<ChartPointDto> chart() {
        return sensorService.chart();
    }
}
