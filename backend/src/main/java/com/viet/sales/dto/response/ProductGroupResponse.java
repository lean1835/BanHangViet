package com.viet.sales.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductGroupResponse {
    private String id;
    private String name;
    private String householdId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
