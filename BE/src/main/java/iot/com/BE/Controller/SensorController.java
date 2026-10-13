package iot.com.BE.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import iot.com.BE.Dto.ApiDtos.PagedResponse;
import iot.com.BE.Dto.ApiDtos.SensorDataDto;
import iot.com.BE.Service.SensorService;

@RestController
@RequestMapping("/api/sensors")
public class SensorController {
    private final SensorService sensorService;

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
    }

    @GetMapping
    public PagedResponse<SensorDataDto> searchReadings(
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return sensorService.searchReadings(type, q, sort, page, size);
    }
}
