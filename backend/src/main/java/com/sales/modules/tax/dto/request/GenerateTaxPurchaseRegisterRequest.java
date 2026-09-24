package com.sales.modules.tax.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTaxPurchaseRegisterRequest {

    @NotBlank(message = "Loại kỳ kê khai không được để trống (MONTHLY hoặc QUARTERLY)")
    @Pattern(regexp = "^(?i)(MONTHLY|QUARTERLY)$", message = "Loại kỳ chỉ chấp nhận MONTHLY hoặc QUARTERLY")
    private String periodType;

    @NotNull(message = "Năm kê khai không được để trống")
    @Min(value = 2000, message = "Năm kê khai phải từ năm 2000 trở lên")
    @Max(value = 2100, message = "Năm kê khai không hợp lệ")
    private Integer year;

    @NotNull(message = "Số thứ tự kỳ không được để trống")
    @Min(value = 1, message = "Số thứ tự kỳ phải lớn hơn hoặc bằng 1")
    @Max(value = 12, message = "Số thứ tự kỳ không vượt quá 12 đối với tháng hoặc 4 đối với quý")
    private Integer periodNumber;
}
