package com.sales.dto.request;

import com.sales.entity.OrderCancelReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderRequest {

    @NotNull(message = "Vui lòng chọn lý do trước khi hủy đơn hàng")
    private OrderCancelReason cancelReason;

    @Size(max = 500, message = "Ghi chú hủy không vượt quá 500 ký tự")
    private String cancelReasonNote;
}
