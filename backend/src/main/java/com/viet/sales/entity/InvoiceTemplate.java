package com.viet.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_templates")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class InvoiceTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "invoice_pattern", nullable = false, length = 10)
    private String invoicePattern;

    @Column(name = "invoice_symbol", nullable = false, length = 10)
    private String invoiceSymbol;

    @Column(nullable = false, length = 150)
    @Builder.Default
    private String title = "HÓA ĐƠN BÁN HÀNG";

    @Column(name = "footer_note", columnDefinition = "TEXT")
    private String footerNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
