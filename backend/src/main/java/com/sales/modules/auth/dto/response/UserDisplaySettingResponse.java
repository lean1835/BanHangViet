package com.sales.modules.auth.dto.response;
import com.sales.common.constant.ButtonSizeLevel;
import com.sales.common.constant.FontSizeLevel;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDisplaySettingResponse {
    private String id;
    private String userId;
    private String username;
    private Boolean simpleModeEnabled;
    private FontSizeLevel fontSizeLevel;
    private String fontSizeLevelName;
    private Integer fontScalePercentage;
    private ButtonSizeLevel buttonSizeLevel;
    private String buttonSizeLevelName;
    private Integer buttonScalePercentage;
    private String minTouchHeight;
    private Boolean showTextLabels;
    private Boolean requireConfirmationDialog;
    private Boolean highContrastEnabled;
    private Boolean simplifiedPosLayout;
    private LocalDateTime updatedAt;
}
