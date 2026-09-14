package com.sales.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmDebtReconciliationRequest {

    @Size(max = 1000, message = "Ghi chú bổ sung không vượt quá 1000 ký tự")
    private String notes; // Thỏa thuận hoặc xác nhận khi ký
}
