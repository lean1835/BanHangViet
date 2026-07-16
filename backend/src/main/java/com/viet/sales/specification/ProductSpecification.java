package com.viet.sales.specification;

import com.viet.sales.entity.Product;
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

            // 1. Ràng buộc theo hộ kinh doanh (Bắt buộc)
            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            // 2. Chỉ lấy sản phẩm chưa bị xóa (deleted_at IS NULL)
            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

            // 3. Lọc theo nhóm hàng (group_id)
            if (StringUtils.hasText(groupId)) {
                predicates.add(criteriaBuilder.equal(root.get("group").get("id"), groupId));
            }

            // 4. Lọc theo trạng thái (status) và loại bỏ hàng ngừng bán (excludeInactive)
            if (Boolean.TRUE.equals(excludeInactive)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), "ACTIVE"));
            } else if (StringUtils.hasText(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            // 5. Tìm kiếm theo tên hoặc SKU
            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate skuPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, skuPredicate));
            }

            // 6. Lọc theo trạng thái tồn kho (IN_STOCK / OUT_OF_STOCK)
            if (StringUtils.hasText(stockFilter)) {
                if ("IN_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(criteriaBuilder.greaterThan(root.get("stockQuantity"), BigDecimal.ZERO));
                } else if ("OUT_OF_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(criteriaBuilder.equal(root.get("stockQuantity"), BigDecimal.ZERO));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
