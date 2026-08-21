package com.sales.entity;

import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "anomaly_rule_configs", indexes = {
        @Index(name = "idx_anomaly_rule_configs_household", columnList = "household_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_household_rule_type", columnNames = {"household_id", "rule_type"})
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AnomalyRuleConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false, length = 50)
    private AnomalyAlertType ruleType;

    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    @Column(name = "threshold_value", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal thresholdValue = BigDecimal.valueOf(5.00);

    @Column(name = "time_window_minutes", nullable = false)
    @Builder.Default
    private Integer timeWindowMinutes = 10;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private AnomalySeverity severity = AnomalySeverity.WARNING;

    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
