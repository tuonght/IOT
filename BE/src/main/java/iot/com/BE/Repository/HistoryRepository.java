package iot.com.BE.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import iot.com.BE.Entity.ActionStatus;
import iot.com.BE.Entity.History;

@Repository
public interface HistoryRepository
        extends JpaRepository<History, Long>, JpaSpecificationExecutor<History> {
    @Query("select distinct h.device.name from History h where h.device.code <> 'LED4' and h.action <> 'ALERT' order by h.device.name")
    List<String> findDistinctDeviceNames();

    Optional<History> findFirstByDevice_IdAndStatusOrderByRequestedAtDesc(
            Long deviceId, ActionStatus status);

    List<History> findAllByStatusAndRequestedAtBefore(ActionStatus status, LocalDateTime cutoff);

}
