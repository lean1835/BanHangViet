package com.sales.modules.platform.repository;
import com.sales.common.constant.IncidentStatus;
import com.sales.modules.platform.entity.PlatformIncident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlatformIncidentRepository extends JpaRepository<PlatformIncident, String> {

    Optional<PlatformIncident> findFirstByEventTypeAndStatusNot(String eventType, IncidentStatus status);

    List<PlatformIncident> findByStatusOrderByStartedAtDesc(IncidentStatus status);

    List<PlatformIncident> findAllByOrderByStartedAtDesc();
}
