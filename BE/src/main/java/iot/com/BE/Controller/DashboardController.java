package iot.com.BE.Controller;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/chart/maxima")
    public Map<String, BigDecimal> chartMaxima() {
        return sensorService.chartMaxima();
    }

    @GetMapping("/chart")
    public List<Map<String, Object>> chart(
            @RequestParam(defaultValue = "all") String sensor) {
        return sensorService.chart(sensor);
    }
}
