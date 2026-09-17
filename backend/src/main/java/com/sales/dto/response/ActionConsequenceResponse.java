package com.sales.dto.response;

import com.sales.constant.ActionSeverity;
import com.sales.constant.ActionType;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionConsequenceResponse {
    private ActionType actionType;
    private String actionName;
    private String targetId;
    private String targetCode;
    private String targetSummary;
    private Boolean isIrreversible;
    private ActionSeverity severity;
    private String warningTitle;
    private List<String> consequences;
    private String confirmPrompt;
    private String confirmButtonText;
    private String cancelButtonText;
}
