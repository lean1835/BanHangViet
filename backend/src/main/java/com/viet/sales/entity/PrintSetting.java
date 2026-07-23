package com.viet.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "print_settings")
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PrintSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false, unique = true)
    @ToString.Exclude
    private BusinessHousehold household;

    @Column(name = "paper_size", nullable = false, length = 10)
    @Builder.Default
    private String paperSize = "K80"; // K80, K57, A4, A5

    @Column(name = "print_copies", nullable = false)
    @Builder.Default
    private Integer printCopies = 1; // 1 to 5

    @Column(name = "auto_print", nullable = false)
    @Builder.Default
    private Boolean autoPrint = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
