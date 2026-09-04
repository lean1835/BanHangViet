package com.sales.specification;

import com.sales.entity.Product;
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

            // 5. Tìm kiếm theo tên, SKU hoặc mã vạch (barcode)
            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern);
                Predicate skuPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("sku")), searchPattern);
                Predicate barcodePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("barcode")), searchPattern);
                predicates.add(criteriaBuilder.or(namePredicate, skuPredicate, barcodePredicate));
            }

            // 6. Lọc theo trạng thái tồn kho (IN_STOCK / OUT_OF_STOCK)
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

            // 1. Ràng buộc theo hộ kinh doanh (Bắt buộc)
            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            // 2. Chỉ lấy sản phẩm chưa bị xóa và đang hoạt động (ACTIVE)
            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
            predicates.add(criteriaBuilder.equal(root.get("status"), "ACTIVE"));

            // 3. Lọc theo nhóm hàng nếu có
            if (StringUtils.hasText(groupId)) {
                predicates.add(criteriaBuilder.equal(root.get("group").get("id"), groupId));
            }

            // 4. Tìm kiếm từ khóa nhận dạng giọng nói theo Tên, SKU hoặc Mã vạch (loại bỏ dấu chấm câu thừa từ Speech Engine)
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

            // Low stock condition:
            // 1. Hàng bị âm kho (stockQuantity < 0) - bắt buộc cảnh báo bất kể minStockQuantity
            // 2. Chạm/dưới ngưỡng tồn tối thiểu (minStockQuantity > 0 AND stockQuantity <= minStockQuantity)
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
