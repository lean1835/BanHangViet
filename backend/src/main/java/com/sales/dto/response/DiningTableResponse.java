package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiningTableResponse {
    private String id;
    private String name;
    private String area;
    private Integer seatCapacity;
    private Integer sortOrder;
    private Boolean isActive;
    // Trạng thái phục vụ hiện tại (POS theo dõi bàn trống / bàn có khách)
    private Boolean isOccupied;
    private String currentOrderId;
    private String currentOrderLabel;
    private Long currentHoldingMinutes;
    private Boolean isOverdue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
