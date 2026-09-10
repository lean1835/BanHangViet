package com.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExpenseThresholdRequest {

    @NotNull(message = "Hạn mức duyệt chi không được để trống")
    @DecimalMin(value = "0.00", message = "Hạn mức duyệt chi phải lớn hơn hoặc bằng 0")
    private BigDecimal expenseApprovalThreshold;
}
