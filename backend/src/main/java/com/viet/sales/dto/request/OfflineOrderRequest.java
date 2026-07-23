package com.viet.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfflineOrderRequest {
    @NotBlank(message = "Mã đơn hàng offline không được để trống")
    private String orderNumber;

    private String customerId;
    private String shiftId;

    @NotNull(message = "Tổng tiền không được để trống")
    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    @NotNull(message = "Thực thu không được để trống")
    private BigDecimal finalAmount;

    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod;

    private String paymentStatus;
    private String discountType;
    private BigDecimal discountRateOrValue;

    @NotNull(message = "Thời gian tạo offline không được để trống")
    private LocalDateTime createdAt;

    @NotEmpty(message = "Đơn hàng phải có ít nhất một sản phẩm")
    private List<@Valid OfflineOrderItemRequest> items;
}
