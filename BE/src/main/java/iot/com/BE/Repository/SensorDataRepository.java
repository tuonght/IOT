package iot.com.BE.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import iot.com.BE.Entity.SensorData;

@Repository
public interface SensorDataRepository
        extends JpaRepository<SensorData, Long>, JpaSpecificationExecutor<SensorData> {
    List<SensorData> findAllByOrderByMeasuredAtDesc(Pageable pageable);

    List<SensorData> findAllBySensor_CodeOrderByMeasuredAtDesc(String sensorCode, Pageable pageable);

    Optional<SensorData> findTopBySensor_CodeOrderByMeasuredAtDesc(String sensorCode);

    @Query("select reading.sensor.code, max(reading.value) from SensorData reading group by reading.sensor.code")
    List<Object[]> findMaximumValuesBySensorCode();
}
