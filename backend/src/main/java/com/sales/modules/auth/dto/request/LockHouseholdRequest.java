package com.sales.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LockHouseholdRequest {

    @NotBlank(message = "Lý do khóa tài khoản hộ kinh doanh không được để trống")
    private String reason;
}
