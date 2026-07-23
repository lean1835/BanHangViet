package com.viet.sales.dto.request;

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
public class PrintSettingRequest {

    @NotBlank(message = "Khổ giấy in không được để trống")
    @Pattern(regexp = "^(K80|K57|A4|A5)$", message = "Khổ giấy phải là K80, K57, A4 hoặc A5")
    private String paperSize;

    @NotNull(message = "Số bản in không được để trống")
    @Min(value = 1, message = "Số bản in tối thiểu là 1")
    @Max(value = 5, message = "Số bản in tối đa là 5")
    private Integer printCopies;

    @NotNull(message = "Tự động bật in không được để trống")
    private Boolean autoPrint;
}
