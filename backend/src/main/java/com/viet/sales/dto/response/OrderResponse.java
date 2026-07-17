package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String id;
    private String orderNumber;
    private String householdId;
    private String shiftId;
    private String createdByUserId;
    private String createdByUsername;
    private String customerId;
    private String customerName;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String status;
    private String syncStatus;
    private Boolean isOffline;
    private LocalDateTime syncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;
    private List<String> warningMessages;
    private String qrCodeUrl;
    private BigDecimal changeAmount;
}
