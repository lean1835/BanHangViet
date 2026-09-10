package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmBankTransferRequest {

    @NotBlank(message = "Mã giao dịch ngân hàng không được để trống khi xác nhận đã nhận tiền")
    @Size(max = 100, message = "Mã giao dịch không được vượt quá 100 ký tự")
    private String transactionCode;

    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String notes;
}
