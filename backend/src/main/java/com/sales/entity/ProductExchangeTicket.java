package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_exchange_tickets", uniqueConstraints = {
    @UniqueConstraint(name = "uk_pet_household_ticket", columnNames = {"household_id", "ticket_number"})
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ProductExchangeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_invoice_id", nullable = false)
    @ToString.Exclude
    private EInvoice originalInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_order_id")
    @ToString.Exclude
    private Order originalOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @ToString.Exclude
    private Customer customer;

    @Column(name = "ticket_number", nullable = false, length = 50)
    private String ticketNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    @ToString.Exclude
    private User createdByUser;

    @Column(name = "exchange_type", nullable = false, length = 20)
    @Builder.Default
    private String exchangeType = "EQUAL_VALUE"; // EQUAL_VALUE, HIGHER_VALUE, LOWER_VALUE

    @Column(name = "total_return_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalReturnAmount = BigDecimal.ZERO;

    @Column(name = "total_exchange_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalExchangeAmount = BigDecimal.ZERO;

    @Column(name = "difference_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal differenceAmount = BigDecimal.ZERO;

    @Column(name = "extra_payment_method", length = 20)
    private String extraPaymentMethod; // CASH, BANK_TRANSFER, QR_TRANSFER, DEBT, NONE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "additional_invoice_id")
    @ToString.Exclude
    private EInvoice additionalInvoice;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "COMPLETED"; // COMPLETED, REDIRECTED_TO_RETURN, CANCELED

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @BatchSize(size = 20)
    @OneToMany(mappedBy = "exchangeTicket", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<ProductExchangeItem> items = new ArrayList<>();
}
