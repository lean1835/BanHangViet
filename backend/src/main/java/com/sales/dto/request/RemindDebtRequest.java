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
public class RemindDebtRequest {
    @NotBlank(message = "ID khách hàng không được để trống")
    private String customerId;

    @Size(max = 2000, message = "Nội dung nhắc nợ không được vượt quá 2000 ký tự")
    private String messageContent;
}
