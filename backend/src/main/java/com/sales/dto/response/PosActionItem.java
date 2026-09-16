package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosActionItem {
    private String code;
    private String label;
    private String icon;
    private String shortcut;
    private Boolean isPrimary;
    private Boolean isDestructive;
    private String description;
}
