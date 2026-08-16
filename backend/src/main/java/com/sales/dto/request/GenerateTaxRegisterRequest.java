package com.sales.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTaxRegisterRequest {

    @NotBlank(message = "Loại kỳ kê khai không được để trống (MONTHLY hoặc QUARTERLY)")
    private String periodType; // MONTHLY, QUARTERLY

    @NotNull(message = "Năm kê khai không được để trống")
    @Min(value = 2000, message = "Năm không hợp lệ")
    @Max(value = 2100, message = "Năm không hợp lệ")
    private Integer year;

    @NotNull(message = "Số thứ tự kỳ không được để trống (Tháng 1-12 hoặc Quý 1-4)")
    @Min(value = 1, message = "Số kỳ phải từ 1 trở lên")
    @Max(value = 12, message = "Số kỳ tối đa là 12")
    private Integer periodNumber;
}
