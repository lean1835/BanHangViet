package com.sales.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "screen_guide_steps", indexes = {
        @Index(name = "idx_sgs_guide_step", columnList = "guide_id, step_number")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_sgs_guide_step", columnNames = {"guide_id", "step_number"})
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ScreenGuideStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guide_id", nullable = false)
    @ToString.Exclude
    private ScreenGuide guide;

    @Column(name = "step_number", nullable = false)
    private Integer stepNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "target_element_selector", length = 100)
    private String targetElementSelector;

    @Column(name = "button_label", length = 100)
    private String buttonLabel;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
