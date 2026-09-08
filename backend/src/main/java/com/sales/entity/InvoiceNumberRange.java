package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_number_ranges")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class InvoiceNumberRange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "invoice_pattern", nullable = false, length = 10)
    private String invoicePattern;

    @Column(name = "invoice_symbol", nullable = false, length = 10)
    private String invoiceSymbol;

    @Column(name = "start_number", nullable = false)
    @Builder.Default
    private Integer startNumber = 1;

    @Column(name = "end_number", nullable = false)
    @Builder.Default
    private Integer endNumber = 1000;

    @Column(name = "current_number", nullable = false)
    @Builder.Default
    private Integer currentNumber = 0;

    @Column(name = "warning_threshold", nullable = false)
    @Builder.Default
    private Integer warningThreshold = 50;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, WARNING_LOW, EXHAUSTED, INACTIVE

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
