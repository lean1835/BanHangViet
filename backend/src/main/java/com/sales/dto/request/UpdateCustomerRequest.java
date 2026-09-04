package com.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerRequest {

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 100, message = "Tên khách hàng không vượt quá 100 ký tự")
    private String name;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không vượt quá 20 ký tự")
    @Pattern(regexp = "^[0-9]{9,15}$", message = "Số điện thoại không hợp lệ")
    private String phoneNumber;

    @Size(max = 100, message = "Email không vượt quá 100 ký tự")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @Size(max = 255, message = "Địa chỉ không vượt quá 255 ký tự")
    private String address;

    @DecimalMin(value = "0.0", message = "Hạn mức công nợ không được nhỏ hơn 0")
    private BigDecimal creditLimit;

    @DecimalMin(value = "0.0", message = "Mức chiết khấu không được nhỏ hơn 0%")
    @DecimalMax(value = "100.0", message = "Mức chiết khấu không được vượt quá 100%")
    private BigDecimal discountRate;

    @Pattern(regexp = "^(PERCENTAGE|CASH)$", message = "Loại chiết khấu không hợp lệ (PERCENTAGE hoặc CASH)")
    private String discountType;

    private Boolean isVip;

    @Min(value = 0, message = "Số ngày nhắc nợ trước hạn không được nhỏ hơn 0")
    @Max(value = 365, message = "Số ngày nhắc nợ trước hạn không được vượt quá 365 ngày")
    private Integer reminderDaysBefore;

    @Min(value = 0, message = "Số ngày nhắc nợ sau quá hạn không được nhỏ hơn 0")
    @Max(value = 365, message = "Số ngày nhắc nợ sau quá hạn không được vượt quá 365 ngày")
    private Integer reminderDaysAfter;
}
