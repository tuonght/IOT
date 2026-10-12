package iot.com.BE.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import iot.com.BE.Entity.SensorData;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    List<SensorData> findAllByOrderByMeasuredAtDesc(Pageable pageable);

    Optional<SensorData> findTopBySensor_CodeOrderByMeasuredAtDesc(String sensorCode);
}
