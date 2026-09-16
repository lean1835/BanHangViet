package com.sales.dto.request;

import com.sales.constant.ButtonSizeLevel;
import com.sales.constant.FontSizeLevel;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserDisplaySettingRequest {

    @NotNull(message = "Trạng thái chế độ đơn giản không được để trống")
    private Boolean simpleModeEnabled;

    @NotNull(message = "Mức cỡ chữ không được để trống")
    private FontSizeLevel fontSizeLevel;

    @NotNull(message = "Mức kích thước nút không được để trống")
    private ButtonSizeLevel buttonSizeLevel;

    @NotNull(message = "Tùy chọn hiển thị nhãn chữ không được để trống")
    private Boolean showTextLabels;

    @NotNull(message = "Tùy chọn yêu cầu xác nhận không được để trống")
    private Boolean requireConfirmationDialog;

    @NotNull(message = "Tùy chọn tương phản cao không được để trống")
    private Boolean highContrastEnabled;

    @NotNull(message = "Tùy chọn thu gọn POS không được để trống")
    private Boolean simplifiedPosLayout;
}
