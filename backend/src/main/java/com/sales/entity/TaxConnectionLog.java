package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tax_connection_logs")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TaxConnectionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(nullable = false, length = 20)
    private String status; // ONLINE, SLOW, OFFLINE

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "last_successful_response_at")
    private LocalDateTime lastSuccessfulResponseAt;

    @Column(name = "pending_queue_count", nullable = false)
    @Builder.Default
    private Integer pendingQueueCount = 0;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
