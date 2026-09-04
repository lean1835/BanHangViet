package com.sales.specification;

import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import com.sales.entity.AnomalyAlert;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AnomalyAlertSpecification {

    public static Specification<AnomalyAlert> filterAlerts(
            String householdId,
            AnomalyAlertType alertType,
            AnomalySeverity severity,
            AnomalyAlertStatus status,
            String actorUsername,
            String keyword,
            LocalDateTime startDate,
            LocalDateTime endDate) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(householdId)) {
                predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));
            }

            if (alertType != null) {
                predicates.add(criteriaBuilder.equal(root.get("alertType"), alertType));
            }

            if (severity != null) {
                predicates.add(criteriaBuilder.equal(root.get("severity"), severity));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(actorUsername)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("actorUser").get("username")),
                        "%" + actorUsername.trim().toLowerCase() + "%"
                ));
            }

            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titlePred = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern);
                Predicate descPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern);
                predicates.add(criteriaBuilder.or(titlePred, descPred));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("detectedAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("detectedAt"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
