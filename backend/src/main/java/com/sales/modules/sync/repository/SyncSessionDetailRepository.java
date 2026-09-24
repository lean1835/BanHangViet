package com.sales.modules.sync.repository;
import com.sales.modules.sync.entity.SyncSessionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SyncSessionDetailRepository extends JpaRepository<SyncSessionDetail, String> {
    List<SyncSessionDetail> findBySyncSessionId(String syncSessionId);
}
