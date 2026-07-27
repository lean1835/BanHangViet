package com.viet.sales.specification;

import com.viet.sales.entity.EInvoice;
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
            String createdByUserId, // Nếu là nhân viên VT-02 thì chèn ID của họ, ngược lại truyền null
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Ràng buộc theo hộ kinh doanh (Bắt buộc)
            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), householdId));

            // 2. Chỉ lấy hóa đơn chưa bị xóa (deleted_at IS NULL)
            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));

            // 3. Phân quyền Nhân viên (VT-02): chỉ lấy hóa đơn do chính mình tạo
            if (StringUtils.hasText(createdByUserId)) {
                predicates.add(criteriaBuilder.equal(root.get("createdByUser").get("id"), createdByUserId));
            }

            // 4. Lọc theo khoảng ngày tạo (startDate và endDate)
            if (startDate != null) {
                LocalDateTime startDateTime = startDate.atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDateTime));
            }
            if (endDate != null) {
                LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDateTime));
            }

            // 5. Lọc theo trạng thái hóa đơn
            if (StringUtils.hasText(status)) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            // 6. Tìm kiếm theo Số hóa đơn hoặc Mã tra cứu (lookupCode)
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
