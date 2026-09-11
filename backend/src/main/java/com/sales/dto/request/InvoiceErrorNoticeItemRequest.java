package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceErrorNoticeItemRequest {

    @NotBlank(message = "Mã hóa đơn không được để trống")
    private String invoiceId;

    @NotBlank(message = "Hình thức xử lý sai sót không được để trống (CANCEL, ADJUST, REPLACE, EXPLAIN)")
    private String handlingType;

    @NotBlank(message = "Lý do sai sót không được để trống")
    private String reason;
}
