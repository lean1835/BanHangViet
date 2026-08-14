package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_sales_registers")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TaxSalesRegister {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    @ToString.Exclude
    private TaxDeclarationPeriod period;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @ToString.Exclude
    private EInvoice invoice;

    @Column(name = "invoice_pattern", nullable = false, length = 20)
    private String invoicePattern;

    @Column(name = "invoice_symbol", nullable = false, length = 20)
    private String invoiceSymbol;

    @Column(name = "invoice_number", nullable = false, length = 20)
    private String invoiceNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDate;

    @Column(name = "buyer_name", length = 255)
    private String buyerName;

    @Column(name = "buyer_tax_code", length = 50)
    private String buyerTaxCode;

    @Column(name = "tax_rate_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRatePercentage = BigDecimal.ZERO;

    @Column(name = "revenue_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal revenueAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "invoice_type", nullable = false, length = 30)
    @Builder.Default
    private String invoiceType = "ORIGINAL"; // ORIGINAL, ADJUSTMENT_DECREASE, ADJUSTMENT_INCREASE

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
