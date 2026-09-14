package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_debt_reconciliation_items")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CustomerDebtReconciliationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reconciliation_id", nullable = false)
    @ToString.Exclude
    private CustomerDebtReconciliation reconciliation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_debt_id")
    @ToString.Exclude
    private CustomerDebt customerDebt;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate;

    @Column(nullable = false, length = 20)
    private String type; // DEBT_CREATED, DEBT_PAID

    @Column(name = "reference_code", length = 100)
    private String referenceCode; // orderNumber, invoiceNumber, hoặc mã phiếu thu

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "running_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal runningBalance = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
