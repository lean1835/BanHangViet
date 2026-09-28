package com.sales.modules.product.specification;
import com.sales.modules.product.entity.Product;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

import java.math.BigDecimal;

public class ProductSpecification {
    public static Specification<Product> filterProducts(
            String householdId,
            String search,
            String groupId,
            String status,
            Boolean excludeInactive,
            String stockFilter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

            if (StringUtils.hasText(groupId)) {
                predicates.add(criteriaBuilder.equal(root.get("group").get("id"), groupId));
            }

            if (Boolean.TRUE.equals(excludeInactive)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), "ACTIVE"));
            } else if (StringUtils.hasText(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate skuPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), searchPattern);
                Predicate barcodePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("barcode")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, skuPredicate, barcodePredicate));
            }

            if (StringUtils.hasText(stockFilter)) {
                if ("IN_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(criteriaBuilder.greaterThan(root.get("stockQuantity"), BigDecimal.ZERO));
                } else if ("OUT_OF_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("stockQuantity"), BigDecimal.ZERO));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> filterVoiceSearch(
            String householdId,
            String queryKeyword,
            String groupId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
            predicates.add(criteriaBuilder.equal(root.get("status"), "ACTIVE"));

            if (StringUtils.hasText(groupId)) {
                predicates.add(criteriaBuilder.equal(root.get("group").get("id"), groupId));
            }

            if (StringUtils.hasText(queryKeyword)) {
                String cleanedKeyword = queryKeyword.trim().replaceAll("^[.,?!;:…\\s]+|[.,?!;:…\\s]+$", "").trim();
                if (StringUtils.hasText(cleanedKeyword)) {
                    String searchPattern = "%" + cleanedKeyword.toLowerCase() + "%";
                    Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                    Predicate skuPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), searchPattern);
                    Predicate barcodePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("barcode")), searchPattern);
                    predicates.add(criteriaBuilder.or(namePredicate, skuPredicate, barcodePredicate));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<Product> filterLowStockProducts(
            String householdId,
            String search,
            String groupId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));
            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
            predicates.add(criteriaBuilder.equal(root.get("status"), "ACTIVE"));

            Predicate isNegativeStock = criteriaBuilder.lessThan(
                    criteriaBuilder.coalesce(root.get("stockQuantity"), BigDecimal.ZERO),
                    BigDecimal.ZERO
            );

            Predicate isUnderMinStock = criteriaBuilder.and(
                    criteriaBuilder.greaterThan(
                            criteriaBuilder.coalesce(root.get("minStockQuantity"), BigDecimal.ZERO),
                            BigDecimal.ZERO
                    ),
                    criteriaBuilder.lessThanOrEqualTo(
                            criteriaBuilder.coalesce(root.get("stockQuantity"), BigDecimal.ZERO),
                            criteriaBuilder.coalesce(root.get("minStockQuantity"), BigDecimal.ZERO)
                    )
            );

            predicates.add(criteriaBuilder.or(isNegativeStock, isUnderMinStock));

            if (StringUtils.hasText(groupId)) {
                predicates.add(criteriaBuilder.equal(root.get("group").get("id"), groupId));
            }

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate skuPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), searchPattern);
                Predicate barcodePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("barcode")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, skuPredicate, barcodePredicate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
