package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_program_configs")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class LoyaltyProgramConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    @Column(name = "spend_amount_per_point", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal spendAmountPerPoint = new BigDecimal("10000.00");

    @Column(name = "point_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal pointValue = new BigDecimal("1000.00");

    @Column(name = "min_points_to_redeem", nullable = false)
    @Builder.Default
    private Integer minPointsToRedeem = 50;

    @Column(name = "max_redeem_rate_per_order", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxRedeemRatePerOrder = new BigDecimal("100.00");

    @Column(name = "point_expiry_days", nullable = false)
    @Builder.Default
    private Integer pointExpiryDays = 365;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
