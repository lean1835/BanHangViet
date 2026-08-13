package com.sales.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    @Min(value = 1, message = "Số đơn offline tối đa phải lớn hơn 0")
    @Max(value = 1000, message = "Số đơn offline tối đa không quá 1000")
    private Integer offlineMaxOrders;

    @Min(value = 1, message = "Số giờ offline tối đa phải lớn hơn 0")
    @Max(value = 168, message = "Số giờ offline tối đa không quá 168 giờ")
    private Integer offlineMaxHours;
}
