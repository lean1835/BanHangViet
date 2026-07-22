package com.viet.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdjustmentInvoiceRequest {

    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    @Size(max = 500, message = "Lý do điều chỉnh không vượt quá 500 ký tự")
    private String adjustmentReason;

    @Size(max = 100, message = "Tên người mua không vượt quá 100 ký tự")
    private String buyerName;

    @Size(max = 20, message = "Mã số thuế người mua không vượt quá 20 ký tự")
    private String buyerTaxCode;

    @Size(max = 255, message = "Địa chỉ người mua không vượt quá 255 ký tự")
    private String buyerAddress;

    @Size(max = 20, message = "Số điện thoại người mua không vượt quá 20 ký tự")
    private String buyerPhone;

    @Size(max = 100, message = "Email người mua không vượt quá 100 ký tự")
    private String buyerEmail;

    @NotEmpty(message = "Hóa đơn điều chỉnh phải chứa ít nhất một dòng hàng")
    @Valid
    private List<CreateAdjustmentInvoiceItemRequest> items;
}
