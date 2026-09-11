package com.sales.dto.request;

import com.sales.constant.CashTransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateCashTransactionRequest {

    @NotNull(message = "Loại giao dịch (INCOME/EXPENSE) không được để trống")
    private CashTransactionType type;

    private String shiftId;

    private String categoryId;

    @NotBlank(message = "Tên loại thu chi không được để trống")
    @Size(max = 100, message = "Tên loại thu chi không được vượt quá 100 ký tự")
    private String categoryName;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1000.00", message = "Số tiền thu chi tối thiểu là 1.000 VNĐ")
    private BigDecimal amount;

    @Size(max = 255, message = "Họ tên người nộp/nhận không vượt quá 255 ký tự")
    private String personName;

    @Size(max = 1000, message = "Ghi chú không vượt quá 1000 ký tự")
    private String notes;
}
