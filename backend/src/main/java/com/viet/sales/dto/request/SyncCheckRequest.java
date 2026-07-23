package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncCheckRequest {
    @NotEmpty(message = "Danh sách mã đơn kiểm tra không được trống")
    private List<String> offlineOrderNumbers;
}
