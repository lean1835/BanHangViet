package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_handovers", indexes = {
        @Index(name = "idx_sh_shift", columnList = "shift_id"),
        @Index(name = "idx_sh_household", columnList = "household_id"),
        @Index(name = "idx_sh_sender", columnList = "sender_user_id"),
        @Index(name = "idx_sh_receiver", columnList = "receiver_user_id"),
        @Index(name = "idx_sh_handover_time", columnList = "handover_time")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ShiftHandover {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    @ToString.Exclude
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_user_id", nullable = false)
    @ToString.Exclude
    private User senderUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_user_id", nullable = false)
    @ToString.Exclude
    private User receiverUser;

    @Column(name = "handover_time", nullable = false)
    @Builder.Default
    private LocalDateTime handoverTime = LocalDateTime.now();

    @Column(name = "stage_number", nullable = false)
    @Builder.Default
    private Integer stageNumber = 1;

    @Column(name = "opening_cash", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal openingCash = BigDecimal.ZERO;

    @Column(name = "cash_revenue", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cashRevenue = BigDecimal.ZERO;

    @Column(name = "expected_cash", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal expectedCash = BigDecimal.ZERO;

    @Column(name = "actual_cash", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal actualCash = BigDecimal.ZERO;

    @Column(name = "difference_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    @Column(name = "difference_reason", columnDefinition = "TEXT")
    private String differenceReason;

    @Column(name = "completed_orders_count", nullable = false)
    @Builder.Default
    private Integer completedOrdersCount = 0;

    @Column(name = "pending_orders_count", nullable = false)
    @Builder.Default
    private Integer pendingOrdersCount = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
