package com.viet.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptDetailInfoResponse {
    private String id;
    private String receiptNumber;
    private LocalDateTime receivedAt;
    private String notes;
    private String createdByUserId;
    private String createdByUserName;
    private List<GoodsReceiptDetailResponse> details;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
