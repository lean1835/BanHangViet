package com.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSupplierRequest {

    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    @Size(max = 100, message = "Tên nhà cung cấp không vượt quá 100 ký tự")
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

    @Size(max = 20, message = "Mã số thuế không vượt quá 20 ký tự")
    private String taxCode;

    private String note;
}
