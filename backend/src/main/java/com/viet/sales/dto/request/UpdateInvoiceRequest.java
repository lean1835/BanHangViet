package com.viet.sales.dto.request;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInvoiceRequest {

    @Size(max = 100, message = "Tên người mua không được vượt quá 100 ký tự")
    private String buyerName;

    @Size(max = 20, message = "Mã số thuế không được vượt quá 20 ký tự")
    private String buyerTaxCode;

    @Size(max = 255, message = "Địa chỉ không được vượt quá 255 ký tự")
    private String buyerAddress;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String buyerPhone;

    @Email(message = "Email không đúng định dạng")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    private String buyerEmail;
}
