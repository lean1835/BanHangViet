package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_adjustment_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceAdjustmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private PriceAdjustmentBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Product product;

    @Column(name = "old_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal oldPrice;

    @Column(name = "new_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal newPrice;

    @Column(name = "price_difference", nullable = false, precision = 15, scale = 2)
    private BigDecimal priceDifference;

    @Column(name = "cost_price", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "is_below_cost", nullable = false)
    @Builder.Default
    private Boolean isBelowCost = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
