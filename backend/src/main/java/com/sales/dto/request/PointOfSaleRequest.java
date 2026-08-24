package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PointOfSaleRequest {

    @NotBlank(message = "Tên điểm bán không được để trống")
    @Size(max = 255, message = "Tên điểm bán không được vượt quá 255 ký tự")
    private String name;

    @Size(max = 50, message = "Mã điểm bán không được vượt quá 50 ký tự")
    private String posCode;

    @NotBlank(message = "Địa chỉ điểm bán không được để trống")
    @Size(max = 500, message = "Địa chỉ điểm bán không được vượt quá 500 ký tự")
    private String address;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phoneNumber;

    @Size(max = 20, message = "Ký hiệu hóa đơn riêng không được vượt quá 20 ký tự")
    private String invoiceSymbol;

    @Builder.Default
    private Boolean isDefault = false;

    @Builder.Default
    private Boolean isActive = true;
}
