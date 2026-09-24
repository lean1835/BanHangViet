package com.sales.modules.support.dto.response;
import com.sales.common.constant.FaqCategory;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqCategoryGroupResponse {
    private FaqCategory category;
    private String categoryDisplayName;
    private Integer totalQuestions;
    private List<FaqItemResponse> questions;
}
