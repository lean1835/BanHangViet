package com.sales.entity;

import com.sales.constant.AdjustmentType;
import com.sales.constant.BatchStatus;
import com.sales.constant.PriceRoundingMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "price_adjustment_batches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceAdjustmentBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @Column(name = "batch_code", nullable = false, length = 50)
    private String batchCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "household_id", nullable = false, length = 36)
    private String householdId;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false, length = 30)
    private AdjustmentType adjustmentType;

    @Column(name = "adjustment_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal adjustmentValue;

    @Column(name = "target_group_id", length = 36)
    private String targetGroupId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rounding_method", nullable = false, length = 30)
    @Builder.Default
    private PriceRoundingMethod roundingMethod = PriceRoundingMethod.NONE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BatchStatus status = BatchStatus.APPLIED;

    @Column(name = "total_items", nullable = false)
    @Builder.Default
    private Integer totalItems = 0;

    @Column(name = "below_cost_items", nullable = false)
    @Builder.Default
    private Integer belowCostItems = 0;

    @Column(name = "applied_by", nullable = false, length = 36)
    private String appliedBy;

    @Column(name = "applied_at", nullable = false)
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "reverted_by", length = 36)
    private String revertedBy;

    @Column(name = "reverted_at")
    private LocalDateTime revertedAt;

    @Column(name = "revert_reason", length = 500)
    private String revertReason;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PriceAdjustmentItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
