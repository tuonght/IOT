package iot.com.BE.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import iot.com.BE.Entity.ActionStatus;
import iot.com.BE.Entity.History;

@Repository
public interface HistoryRepository extends JpaRepository<History, Long> {
    List<History> findAllByOrderByRequestedAtDesc();

    Optional<History> findFirstByDevice_IdAndActionAndStatusOrderByRequestedAtDesc(
            Long deviceId, String action, ActionStatus status);

    List<History> findAllByStatusAndRequestedAtBefore(ActionStatus status, LocalDateTime cutoff);
}
