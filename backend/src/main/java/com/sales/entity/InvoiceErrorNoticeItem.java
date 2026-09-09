package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_error_notice_items", uniqueConstraints = {
    @UniqueConstraint(name = "uq_notice_item", columnNames = {"notice_id", "invoice_id"})
}, indexes = {
    @Index(name = "idx_notice_item_inv", columnList = "invoice_id")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class InvoiceErrorNoticeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    @ToString.Exclude
    private InvoiceErrorNotice notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @ToString.Exclude
    private EInvoice invoice;

    @Column(name = "invoice_number", length = 20)
    private String invoiceNumber;

    @Column(name = "invoice_pattern", length = 10)
    private String invoicePattern;

    @Column(name = "invoice_symbol", length = 10)
    private String invoiceSymbol;

    @Column(name = "tax_authority_code", length = 100)
    private String taxAuthorityCode;

    @Column(name = "handling_type", nullable = false, length = 30)
    private String handlingType; // CANCEL, ADJUST, REPLACE, EXPLAIN

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
