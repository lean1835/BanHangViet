package com.sales.modules.support.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "screen_guides", indexes = {
        @Index(name = "idx_sg_screen_code", columnList = "screen_code", unique = true),
        @Index(name = "idx_sg_view_count", columnList = "view_count"),
        @Index(name = "idx_sg_is_active", columnList = "is_active")
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ScreenGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @Column(name = "screen_code", nullable = false, unique = true, length = 50)
    private String screenCode;

    @Column(name = "screen_name", nullable = false)
    private String screenName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "action_url")
    private String actionUrl;

    @Column(name = "target_role", nullable = false, length = 50)
    @Builder.Default
    private String targetRole = "ALL";

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "guide", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("stepNumber ASC")
    @ToString.Exclude
    @Builder.Default
    private List<ScreenGuideStep> steps = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addStep(ScreenGuideStep step) {
        steps.add(step);
        step.setGuide(this);
    }

    public void removeStep(ScreenGuideStep step) {
        steps.remove(step);
        step.setGuide(null);
    }
}
