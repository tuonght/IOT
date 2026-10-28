package iot.com.BE.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import iot.com.BE.Entity.DeviceAlertEvent;

public interface DeviceAlertEventRepository extends JpaRepository<DeviceAlertEvent, Long> {
    interface DailyCount {
        String getDay();
        String getDeviceCode();
        long getTotal();
    }

    @Query(value = """
            SELECT DATE_FORMAT(measured_at, '%Y-%m-%d') AS day,
                   device_code AS deviceCode, COUNT(*) AS total
            FROM device_alert_events
            WHERE measured_at >= :start AND measured_at < :end
            GROUP BY DATE_FORMAT(measured_at, '%Y-%m-%d'), device_code
            ORDER BY day, device_code
            """, nativeQuery = true)
    List<DailyCount> countByDay(
            @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
