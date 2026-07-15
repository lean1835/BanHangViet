package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Tên hộ kinh doanh không được để trống")
    @Size(max = 255, message = "Tên hộ kinh doanh không được vượt quá 255 ký tự")
    private String householdName;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Size(max = 20, message = "Mã số thuế không được vượt quá 20 ký tự")
    private String taxCode;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String householdAddress;

    @NotBlank(message = "Số điện thoại hộ kinh doanh không được để trống")
    @Size(max = 20, message = "Số điện thoại hộ kinh doanh không được vượt quá 20 ký tự")
    private String householdPhone;

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 50, message = "Tên đăng nhập phải từ 4 đến 50 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải chứa ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Họ và tên chủ hộ không được để trống")
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại cá nhân không được vượt quá 20 ký tự")
    private String phone;
}
