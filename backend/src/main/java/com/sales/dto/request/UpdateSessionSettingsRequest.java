package com.sales.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSessionSettingsRequest {

    @NotNull(message = "Thời gian tự hết hạn phiên không được để trống")
    @Min(value = 5, message = "Thời gian tự hết hạn phiên tối thiểu là 5 phút")
    @Max(value = 1440, message = "Thời gian tự hết hạn phiên tối đa là 1440 phút (24 giờ)")
    private Integer sessionTimeoutMinutes;
}
