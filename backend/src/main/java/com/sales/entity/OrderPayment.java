package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_payments")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class OrderPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod; // CASH, BANK_TRANSFER, DEBT

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "amount_given", precision = 15, scale = 2)
    private BigDecimal amountGiven;

    @Column(name = "change_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal changeAmount = BigDecimal.ZERO;

    @Column(name = "transaction_code", length = 100)
    private String transactionCode;

    @Column(name = "is_confirmed", nullable = false)
    @Builder.Default
    private Boolean isConfirmed = true;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_user_id")
    @ToString.Exclude
    private User confirmedByUser;

    @Column(length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
