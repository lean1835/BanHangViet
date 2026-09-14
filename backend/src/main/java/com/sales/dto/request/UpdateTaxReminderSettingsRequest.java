package com.sales.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaxReminderSettingsRequest {

    @NotBlank(message = "Kỳ kê khai thuế không được để trống")
    @Pattern(regexp = "MONTHLY|QUARTERLY", message = "Kỳ kê khai thuế phải là MONTHLY hoặc QUARTERLY")
    private String taxPeriodType;

    @NotNull(message = "Số ngày nhắc trước hạn không được để trống")
    @Min(value = 1, message = "Số ngày nhắc trước hạn tối thiểu là 1 ngày")
    @Max(value = 30, message = "Số ngày nhắc trước hạn tối đa là 30 ngày")
    private Integer taxReminderDaysBefore;

    @NotNull(message = "Trạng thái bật/tắt nhắc lịch không được để trống")
    private Boolean taxReminderEnabled;
}
