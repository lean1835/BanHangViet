package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordResponse {
    private String token;
}
