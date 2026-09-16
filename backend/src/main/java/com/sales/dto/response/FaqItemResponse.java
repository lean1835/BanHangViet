package com.sales.dto.response;

import com.sales.constant.FaqCategory;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqItemResponse {
    private String id;
    private FaqCategory category;
    private String categoryDisplayName;
    private String question;
    private String answer;
    private String actionUrl;
    private String actionLabel;
    private String keywords;
    private Integer displayOrder;
    private Long viewCount;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
