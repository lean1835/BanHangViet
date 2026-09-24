package com.sales.modules.backup.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriggerVerificationRequest {

    /**
     * ID bản sao lưu cụ thể muốn thử phục hồi.
     * Nếu để trống hoặc null, hệ thống tự động chọn bản sao lưu thành công gần nhất.
     */
    @Size(max = 36, message = "Mã bản sao lưu không được vượt quá 36 ký tự")
    private String backupHistoryId;

    /**
     * Ghi chú bổ sung từ chủ hộ khi chạy thử nghiệm thủ công.
     */
    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String notes;
}
