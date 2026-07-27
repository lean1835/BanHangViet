package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateHouseholdRequest {

    @NotBlank(message = "Tên hộ kinh doanh không được để trống")
    @Size(max = 255, message = "Tên hộ kinh doanh không được vượt quá 255 ký tự")
    private String name;

    @NotBlank(message = "Mã số thuế không được để trống")
    @Pattern(regexp = "^[0-9]{10}(-[0-9]{3})?$", message = "Mã số thuế phải đúng định dạng 10 hoặc 13 chữ số")
    private String taxCode;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String address;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^0[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng")
    private String phoneNumber;

    @Size(max = 100, message = "Tên người đại diện không được vượt quá 100 ký tự")
    private String representativeName;
}
