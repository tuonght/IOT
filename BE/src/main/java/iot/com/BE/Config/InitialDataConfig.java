package iot.com.BE.Config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import iot.com.BE.Entity.Device;
import iot.com.BE.Entity.Sensor;
import iot.com.BE.Repository.DeviceRepository;
import iot.com.BE.Repository.SensorRepository;

@Configuration
public class InitialDataConfig {

    @Bean
    ApplicationRunner initializeIotDevices(DeviceRepository devices, SensorRepository sensors) {
        return args -> {
            for (int index = 1; index <= 3; index++) {
                String code = "LED" + index;
                if (devices.findByCode(code).isEmpty()) {
                    Device device = new Device();
                    device.setCode(code);
                    device.setName("Đèn " + index);
                    devices.save(device);
                }
            }
            addSensorIfMissing(sensors, "temperature", "Nhiệt độ", "TEMPERATURE", "°C");
            addSensorIfMissing(sensors, "humidity", "Độ ẩm", "HUMIDITY", "%");
            addSensorIfMissing(sensors, "light", "Ánh sáng", "LIGHT", "lux");
        };
    }

    private void addSensorIfMissing(
            SensorRepository sensors, String code, String name, String type, String unit) {
        Sensor sensor = sensors.findByCode(code).orElse(null);
        if (sensor == null) {
            sensor = new Sensor();
            sensor.setCode(code);
            sensor.setName(name);
            sensor.setType(type);
            sensor.setUnit(unit);
        }
        sensor.setName(name);
        sensor.setType(type);
        sensor.setUnit(unit);
        sensors.save(sensor);
    }
}
