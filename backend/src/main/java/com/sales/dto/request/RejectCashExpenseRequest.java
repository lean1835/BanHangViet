package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RejectCashExpenseRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 500, message = "Lý do từ chối không vượt quá 500 ký tự")
    private String reason;
}
