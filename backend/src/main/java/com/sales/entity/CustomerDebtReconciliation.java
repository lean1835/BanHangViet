package com.sales.entity;

import com.sales.constant.ReconciliationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_debt_reconciliations")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CustomerDebtReconciliation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @Column(nullable = false, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @ToString.Exclude
    private Customer customer;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "opening_debt_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal openingDebtBalance = BigDecimal.ZERO;

    @Column(name = "total_debt_incurred", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDebtIncurred = BigDecimal.ZERO;

    @Column(name = "total_debt_paid", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDebtPaid = BigDecimal.ZERO;

    @Column(name = "closing_debt_balance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal closingDebtBalance = BigDecimal.ZERO;

    @Column(name = "closing_debt_in_words", nullable = false, length = 255)
    private String closingDebtInWords;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = ReconciliationStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_user_id")
    @ToString.Exclude
    private User confirmedByUser;

    @Column(name = "reconciled_to_date")
    private LocalDate reconciledToDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    @ToString.Exclude
    private User createdByUser;

    @OneToMany(mappedBy = "reconciliation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private List<CustomerDebtReconciliationItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
