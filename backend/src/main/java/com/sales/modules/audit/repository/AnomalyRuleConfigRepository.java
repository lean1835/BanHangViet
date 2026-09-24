package com.sales.modules.audit.repository;
import com.sales.common.constant.AnomalyAlertType;
import com.sales.modules.audit.entity.AnomalyRuleConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnomalyRuleConfigRepository extends JpaRepository<AnomalyRuleConfig, String> {

    List<AnomalyRuleConfig> findByHouseholdIdOrderByCreatedAtAsc(String householdId);

    Optional<AnomalyRuleConfig> findByIdAndHouseholdId(String id, String householdId);

    Optional<AnomalyRuleConfig> findByHouseholdIdAndRuleType(String householdId, AnomalyAlertType ruleType);
}
