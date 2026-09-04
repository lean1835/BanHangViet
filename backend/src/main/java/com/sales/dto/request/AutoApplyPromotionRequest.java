package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoApplyPromotionRequest {

    @NotEmpty(message = "Danh sách mặt hàng kiểm tra không được để trống")
    @Valid
    private List<OrderItemPromotionCheckRequest> items;
}
