package com.sales.modules.auth.entity;
import com.sales.common.constant.ButtonSizeLevel;
import com.sales.common.constant.FontSizeLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_display_settings", indexes = {
        @Index(name = "idx_uds_user_id", columnList = "user_id", unique = true)
})
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserDisplaySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false)
    @EqualsAndHashCode.Include
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @ToString.Exclude
    private User user;

    @Column(name = "simple_mode_enabled", nullable = false)
    @Builder.Default
    private Boolean simpleModeEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "font_size_level", nullable = false, length = 20)
    @Builder.Default
    private FontSizeLevel fontSizeLevel = FontSizeLevel.STANDARD;

    @Enumerated(EnumType.STRING)
    @Column(name = "button_size_level", nullable = false, length = 20)
    @Builder.Default
    private ButtonSizeLevel buttonSizeLevel = ButtonSizeLevel.STANDARD;

    @Column(name = "show_text_labels", nullable = false)
    @Builder.Default
    private Boolean showTextLabels = true;

    @Column(name = "require_confirmation_dialog", nullable = false)
    @Builder.Default
    private Boolean requireConfirmationDialog = true;

    @Column(name = "high_contrast_enabled", nullable = false)
    @Builder.Default
    private Boolean highContrastEnabled = false;

    @Column(name = "simplified_pos_layout", nullable = false)
    @Builder.Default
    private Boolean simplifiedPosLayout = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
