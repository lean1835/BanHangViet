package com.sales.modules.pos.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosSimplifiedLayoutResponse {
    private Boolean isSimpleMode;
    private List<PosActionItem> primaryActions;
    private List<PosActionItem> moreActions;
    private String fontScaleStyle;
    private String buttonMinHeightStyle;
}
