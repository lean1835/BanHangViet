package com.viet.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id")
    private Shift shift;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(name = "payment_method", nullable = false, length = 20)
    @Builder.Default
    private String paymentMethod = "CASH"; // CASH, BANK_TRANSFER, DEBT

    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, PAID, DEBT

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "CREATING"; // CREATING, COMPLETED, CANCELED

    @Column(name = "sync_status", nullable = false, length = 20)
    @Builder.Default
    private String syncStatus = "SYNCED"; // SYNCED, PENDING, CONFLICTED

    @Column(name = "is_offline", nullable = false)
    @Builder.Default
    private Boolean isOffline = false;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Column(name = "discount_type", length = 20)
    private String discountType;

    @Column(name = "discount_rate_or_value", precision = 15, scale = 2)
    private BigDecimal discountRateOrValue;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<OrderItem> items = new ArrayList<>();
}
