package com.viet.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.viet.sales.constant.ConflictResolutionStrategy;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncResolveRequest {
    @NotBlank(message = "Mã đơn hàng xung đột không được để trống")
    private String orderNumber;

    @NotNull(message = "Chiến lược giải quyết không được để trống")
    private ConflictResolutionStrategy resolutionStrategy; // OVERWRITE_SERVER, KEEP_SERVER, KEEP_BOTH

    @Valid
    private OfflineOrderRequest clientOrderData;
}
