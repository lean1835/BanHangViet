package com.sales.modules.auth.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePhoneSendOtpResponse {
    private String phoneNumber;
    private long expiresInSeconds;
    private String message;
}
