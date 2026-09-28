package com.sales.modules.promotion.specification;
import com.sales.common.constant.PromotionStatus;
import com.sales.modules.promotion.dto.request.PromotionSearchParam;
import com.sales.modules.promotion.entity.Promotion;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PromotionSpecification {
    public static Specification<Promotion> filterPromotions(String householdId, PromotionSearchParam param) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

            if (param != null) {
                if (StringUtils.hasText(param.getKeyword())) {
                    String pattern = "%" + param.getKeyword().trim().toLowerCase() + "%";
                    Predicate nameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), pattern);
                    Predicate descMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern);
                    predicates.add(criteriaBuilder.or(nameMatch, descMatch));
                }

                if (param.getStatus() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), param.getStatus()));
                }

                if (param.getApplyScope() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("applyScope"), param.getApplyScope()));
                }

                if (param.getStartDate() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startDate"), param.getStartDate()));
                }
                if (param.getEndDate() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("endDate"), param.getEndDate()));
                }

                if (Boolean.TRUE.equals(param.getActiveNowOnly())) {
                    LocalDateTime now = LocalDateTime.now();
                    predicates.add(criteriaBuilder.equal(root.get("status"), PromotionStatus.ACTIVE));
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startDate"), now));
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("endDate"), now));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
