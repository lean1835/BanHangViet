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
public class CreateReturnTicketRequest {

    @NotBlank(message = "Mã hóa đơn gốc không được để trống")
    private String originalInvoiceId;

    private String reason;

    @Builder.Default
    private String refundPaymentMethod = "CASH"; // CASH, BANK_TRANSFER, DEBT_REDUCTION

    @NotEmpty(message = "Danh sách sản phẩm trả lại không được rỗng")
    @Valid
    private List<CreateReturnTicketItemRequest> items;
}
