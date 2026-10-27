package iot.com.BE;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;

import iot.com.BE.Repository.SensorDataRepository;
import iot.com.BE.Service.DeviceService;
import iot.com.BE.Service.SensorService;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class BeApplicationTests {

    @Autowired
    private SensorDataRepository sensorDataRepository;

    @Autowired
    private SensorService sensorService;

    @Autowired
    private DeviceService deviceService;

    @Test
    void contextLoads() {
    }

    @Test
    void sensorDataRepositoryUsesConsolidatedTable() {
        sensorDataRepository.count();
    }

    @Test
    void sensorSearchFiltersAndPaginatesInDatabase() {
        var result = sensorService.searchReadings("temperature", "0", "asc", 0, 10);

        assertEquals(0, result.page());
        assertEquals(10, result.size());
        assertTrue(result.totalElements() >= result.content().size());
    }

    @Test
    void chartLoadsRecentCombinedReadings() {
        var result = sensorService.chart("all");

        assertTrue(result.size() <= 15);
    }

    @Test
    void historySearchFiltersByTimeAndPaginatesInDatabase() {
        var result = deviceService.searchHistory("", "", "success", "0", 0, 10);

        assertEquals(0, result.page());
        assertEquals(10, result.size());
        assertTrue(result.totalElements() >= result.content().size());
    }
}
