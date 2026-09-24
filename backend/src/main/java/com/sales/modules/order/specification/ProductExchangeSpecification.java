package com.sales.modules.order.specification;
import com.sales.modules.order.entity.ProductExchangeTicket;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class ProductExchangeSpecification {

    public static Specification<ProductExchangeTicket> filterTickets(
            String householdId,
            String invoiceId,
            String exchangeType,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            if (StringUtils.hasText(invoiceId)) {
                predicates.add(criteriaBuilder.equal(root.get("originalInvoice").get("id"), invoiceId));
            }

            if (StringUtils.hasText(exchangeType)) {
                predicates.add(criteriaBuilder.equal(root.get("exchangeType"), exchangeType));
            }

            if (StringUtils.hasText(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (startDate != null) {
                LocalDateTime startDateTime = startDate.atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDateTime));
            }

            if (endDate != null) {
                LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDateTime));
            }

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate ticketNumPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("ticketNumber")), searchPattern);
                Predicate invoiceNumPred = criteriaBuilder.like(criteriaBuilder.lower(root.get("originalInvoice").get("invoiceNumber")), searchPattern);
                predicates.add(criteriaBuilder.or(ticketNumPred, invoiceNumPred));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
