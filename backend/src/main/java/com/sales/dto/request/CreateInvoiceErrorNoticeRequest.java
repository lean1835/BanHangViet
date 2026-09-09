package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceErrorNoticeRequest {

    private String noticePlace;

    private String taxAuthorityName;

    @NotEmpty(message = "Danh sách hóa đơn khai báo sai sót không được để trống")
    @Valid
    private List<InvoiceErrorNoticeItemRequest> items;
}
