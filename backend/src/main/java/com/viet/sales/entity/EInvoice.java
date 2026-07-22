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
@Table(name = "e_invoices")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class EInvoice {

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
    @JoinColumn(name = "order_id")
    @ToString.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_invoice_id")
    @ToString.Exclude
    private EInvoice originalInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    @ToString.Exclude
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canceled_by_user_id")
    @ToString.Exclude
    private User canceledByUser;

    @Column(name = "invoice_number", length = 20)
    private String invoiceNumber;

    @Column(name = "invoice_pattern", nullable = false, length = 10)
    private String invoicePattern;

    @Column(name = "invoice_symbol", nullable = false, length = 10)
    private String invoiceSymbol;

    @Column(name = "buyer_name", length = 100)
    private String buyerName;

    @Column(name = "buyer_tax_code", length = 20)
    private String buyerTaxCode;

    @Column(name = "buyer_address", length = 255)
    private String buyerAddress;

    @Column(name = "buyer_phone", length = 20)
    private String buyerPhone;

    @Column(name = "buyer_email", length = 100)
    private String buyerEmail;

    @Column(name = "total_amount_before_tax", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmountBeforeTax = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal finalAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, WAITING_TAX_CODE, ISSUED, SEND_ERROR, ADJUSTED, CANCELED

    @Column(name = "tax_authority_code", length = 100, unique = true)
    private String taxAuthorityCode;

    @Column(name = "tax_authority_response", columnDefinition = "TEXT")
    private String taxAuthorityResponse;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String cancelReason;

    @Column(name = "lookup_code", nullable = false, length = 50, unique = true)
    private String lookupCode;

    @Column(name = "sent_to_tax_at")
    private LocalDateTime sentToTaxAt;

    @Column(name = "tax_response_at")
    private LocalDateTime taxResponseAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @org.hibernate.annotations.BatchSize(size = 20)
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<EInvoiceItem> items = new ArrayList<>();
}
