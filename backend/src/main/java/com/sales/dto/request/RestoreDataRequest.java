package com.sales.dto.request;

import jakarta.validation.constraints.AssertTrue;
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
public class RestoreDataRequest {

    @NotBlank(message = "Mã bản sao lưu (backupHistoryId) không được để trống")
    private String backupHistoryId;

    @NotNull(message = "Yêu cầu xác nhận phục hồi dữ liệu")
    @AssertTrue(message = "Bắt buộc phải xác nhận đồng ý phục hồi dữ liệu (confirm=true)")
    private Boolean confirm;

    private String notes;
}
