package com.sales.specification;

import com.sales.entity.ReturnTicket;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class ReturnTicketSpecification {

    public static Specification<ReturnTicket> filterTickets(
            String householdId,
            String createdByUserId,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

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
                Predicate ticketNumPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("ticketNumber")), searchPattern);
                Predicate invoiceNumPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("originalInvoice").get("invoiceNumber")), searchPattern);
                Predicate lookupCodePred = criteriaBuilder.like(criteriaBuilder.lower(root.get("originalInvoice").get("lookupCode")), searchPattern);
                predicates.add(criteriaBuilder.or(ticketNumPred, invoiceNumPred, lookupCodePred));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
