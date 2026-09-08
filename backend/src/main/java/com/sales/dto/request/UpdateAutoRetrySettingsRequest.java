package com.sales.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAutoRetrySettingsRequest {

    @NotNull(message = "Trạng thái bật/tắt tự động gửi lại không được để trống")
    private Boolean autoRetryEnabled;

    @NotNull(message = "Số lần thử tối đa không được để trống")
    @Min(value = 1, message = "Số lần thử tối đa tối thiểu là 1")
    @Max(value = 10, message = "Số lần thử tối đa tối đa là 10")
    private Integer maxRetryAttempts;

    @NotNull(message = "Khoảng cách giữa các lần thử không được để trống")
    @Min(value = 5, message = "Khoảng cách giữa các lần thử tối thiểu là 5 phút")
    @Max(value = 1440, message = "Khoảng cách giữa các lần thử tối đa là 1440 phút (24 giờ)")
    private Integer retryIntervalMinutes;

    @NotNull(message = "Hạn tối đa gửi lại không được để trống")
    @Min(value = 1, message = "Hạn tối đa gửi lại tối thiểu là 1 giờ")
    @Max(value = 168, message = "Hạn tối đa gửi lại tối đa là 168 giờ (7 ngày)")
    private Integer maxRetryHoursDeadline;
}
