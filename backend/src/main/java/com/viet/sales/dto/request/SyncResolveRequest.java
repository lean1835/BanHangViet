package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncResolveRequest {
    @NotBlank(message = "Mã đơn hàng xung đột không được để trống")
    private String orderNumber;

    @NotBlank(message = "Chiến lược giải quyết không được để trống")
    private String resolutionStrategy; // OVERWRITE_SERVER, KEEP_SERVER, KEEP_BOTH

    private OfflineOrderRequest clientOrderData;
}
