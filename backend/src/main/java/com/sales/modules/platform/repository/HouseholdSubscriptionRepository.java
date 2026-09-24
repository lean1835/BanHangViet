package com.sales.modules.platform.repository;
import com.sales.common.constant.SubscriptionStatus;
import com.sales.modules.platform.entity.HouseholdSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdSubscriptionRepository extends JpaRepository<HouseholdSubscription, String> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"servicePackage", "household"})
    Optional<HouseholdSubscription> findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(String householdId, SubscriptionStatus status);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"servicePackage", "household"})
    List<HouseholdSubscription> findByHouseholdIdOrderByCreatedAtDesc(String householdId);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"servicePackage", "household"})
    List<HouseholdSubscription> findByHouseholdIdInAndStatusOrderByCreatedAtDesc(java.util.Collection<String> householdIds, SubscriptionStatus status);

    boolean existsByServicePackageId(String packageId);
}
