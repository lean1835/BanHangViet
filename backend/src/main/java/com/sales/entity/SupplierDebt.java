package com.sales.entity;

import com.sales.constant.DebtStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "supplier_debts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDebt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goods_receipt_id")
    private GoodsReceipt goodsReceipt;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "remaining_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String type; // DEBT_CREATED, DEBT_PAID

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = DebtStatus.PENDING; // PENDING, PAID, OVERDUE

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod; // CASH, BANK_TRANSFER

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
