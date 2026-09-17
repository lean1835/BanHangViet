package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
public class CreateProductExchangeRequest {

    @NotBlank(message = "ID hóa đơn gốc không được để trống")
    private String originalInvoiceId;

    @NotEmpty(message = "Danh sách mặt hàng trả lại không được để trống")
    @Valid
    private List<ExchangeReturnItemRequest> returnItems;

    @NotEmpty(message = "Danh sách mặt hàng đổi sang không được để trống")
    @Valid
    private List<ExchangeNewItemRequest> exchangeItems;

    private String extraPaymentMethod; // CASH, BANK_TRANSFER, QR_TRANSFER, DEBT

    private String reason;

    private String notes;
}
