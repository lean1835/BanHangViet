package com.sales.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sync_session_details", indexes = {
    @Index(name = "idx_sync_detail_session", columnList = "sync_session_id"),
    @Index(name = "idx_sync_detail_order_number", columnList = "order_number")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncSessionDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sync_session_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SyncSession syncSession;

    @Column(name = "order_number", length = 50, nullable = false)
    private String orderNumber;

    @Column(nullable = false, length = 30)
    private String status; // SUCCESS, DUPLICATE, CONFLICT, MISSING, FAILED

    @Column(length = 500)
    private String note;
}
