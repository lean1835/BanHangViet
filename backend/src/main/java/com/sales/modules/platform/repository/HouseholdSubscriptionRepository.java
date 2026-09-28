package com.sales.modules.platform.repository;
import com.sales.common.constant.SubscriptionStatus;
import com.sales.modules.platform.entity.HouseholdSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface HouseholdSubscriptionRepository extends JpaRepository<HouseholdSubscription, String> {
    @EntityGraph(attributePaths = {"servicePackage", "household"})
    Optional<HouseholdSubscription> findFirstByHouseholdIdAndStatusOrderByCreatedAtDesc(String householdId, SubscriptionStatus status);

    @EntityGraph(attributePaths = {"servicePackage", "household"})
    List<HouseholdSubscription> findByHouseholdIdOrderByCreatedAtDesc(String householdId);

    @EntityGraph(attributePaths = {"servicePackage", "household"})
    List<HouseholdSubscription> findByHouseholdIdInAndStatusOrderByCreatedAtDesc(Collection<String> householdIds, SubscriptionStatus status);

    boolean existsByServicePackageId(String packageId);
}
