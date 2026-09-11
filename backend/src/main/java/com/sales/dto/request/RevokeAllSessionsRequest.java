package com.sales.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevokeAllSessionsRequest {

    @Size(max = 255, message = "Lý do đăng xuất không được vượt quá 255 ký tự")
    private String reason;
}
