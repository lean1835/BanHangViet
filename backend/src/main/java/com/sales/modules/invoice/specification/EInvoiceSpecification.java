package com.sales.modules.invoice.specification;
import com.sales.modules.invoice.entity.EInvoice;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class EInvoiceSpecification {
    public static Specification<EInvoice> filterInvoices(
            String householdId,
            String createdByUserId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

            if (StringUtils.hasText(createdByUserId)) {
                predicates.add(criteriaBuilder.equal(root.get("createdByUser").get("id"), createdByUserId));
            }

            if (startDate != null) {
                LocalDateTime startDateTime = startDate.atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDateTime));
            }
            if (endDate != null) {
                LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDateTime));
            }

            if (StringUtils.hasText(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numberPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceNumber")), searchPattern);
                Predicate lookupPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("lookupCode")), searchPattern);
                predicates.add(criteriaBuilder.or(numberPredicate, lookupPredicate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
