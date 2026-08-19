package com.sales.dto.request;

import com.sales.constant.BackupType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

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
public class UpdateBackupConfigRequest {

    @NotNull(message = "Trạng thái tự động sao lưu không được để trống")
    private Boolean isAutoBackupEnabled;

    @NotNull(message = "Thời gian chạy sao lưu không được để trống")
    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Thời gian sao lưu không đúng định dạng HH:mm (từ 00:00 đến 23:59)")
    private String scheduledTime;

    @NotNull(message = "Số lượng bản sao lưu giữ lại không được để trống")
    @Min(value = 1, message = "Số lượng bản sao lưu giữ lại phải từ 1 đến 100")
    @Max(value = 100, message = "Số lượng bản sao lưu giữ lại phải từ 1 đến 100")
    private Integer retentionCount;

    @NotNull(message = "Loại sao lưu không được để trống")
    private BackupType backupType;
}
