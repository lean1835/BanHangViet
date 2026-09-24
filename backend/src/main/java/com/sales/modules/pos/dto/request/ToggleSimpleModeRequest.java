package com.sales.modules.pos.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ToggleSimpleModeRequest {

    @NotNull(message = "Trạng thái bật/tắt chế độ đơn giản không được để trống")
    private Boolean enabled;
}
