package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceTemplateRequest {

    @NotBlank(message = "Mẫu số hóa đơn không được để trống")
    @Size(max = 10, message = "Mẫu số hóa đơn không vượt quá 10 ký tự")
    private String invoicePattern;

    @NotBlank(message = "Ký hiệu hóa đơn không được để trống")
    @Size(max = 10, message = "Ký hiệu hóa đơn không vượt quá 10 ký tự")
    @Pattern(regexp = "^[1-2]?[CK][0-9]{2}[A-Z]{2,3}$", message = "Ký hiệu hóa đơn không đúng quy định TT78")
    private String invoiceSymbol;

    @NotBlank(message = "Tiêu đề hóa đơn không được để trống")
    @Size(max = 150, message = "Tiêu đề hóa đơn không vượt quá 150 ký tự")
    private String title;

    private String footerNote;
}
