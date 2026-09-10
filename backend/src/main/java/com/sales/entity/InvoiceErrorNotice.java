package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoice_error_notices", indexes = {
    @Index(name = "idx_notice_household", columnList = "household_id")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class InvoiceErrorNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "notice_code", nullable = false, length = 50, unique = true)
    private String noticeCode;

    @Column(name = "notice_type", nullable = false, length = 20)
    @Builder.Default
    private String noticeType = "04/SS";

    @Column(name = "notice_place", length = 100)
    private String noticePlace;

    @Column(name = "tax_authority_name", length = 255)
    private String taxAuthorityName;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, WAITING_TAX_RESPONSE, ACCEPTED, REJECTED

    @Column(name = "tax_authority_code", length = 100)
    private String taxAuthorityCode;

    @Column(name = "tax_authority_response", columnDefinition = "TEXT")
    private String taxAuthorityResponse;

    @Column(name = "sent_to_tax_at")
    private LocalDateTime sentToTaxAt;

    @Column(name = "tax_response_at")
    private LocalDateTime taxResponseAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    @ToString.Exclude
    private User createdByUser;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @org.hibernate.annotations.BatchSize(size = 20)
    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @ToString.Exclude
    private List<InvoiceErrorNoticeItem> items = new ArrayList<>();
}
