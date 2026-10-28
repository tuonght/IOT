package iot.com.BE.Repository;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import iot.com.BE.Entity.DeviceAlertRule;

public interface DeviceAlertRuleRepository extends JpaRepository<DeviceAlertRule, String> {
    List<DeviceAlertRule> findAllByOrderByDeviceCodeAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from DeviceAlertRule r order by r.deviceCode")
    List<DeviceAlertRule> findAllForUpdate();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from DeviceAlertRule r where r.deviceCode = :code")
    Optional<DeviceAlertRule> findForUpdate(@Param("code") String code);
}
