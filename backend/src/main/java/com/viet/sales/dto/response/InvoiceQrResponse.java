package com.viet.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceQrResponse {
    private String invoiceId;
    private String lookupCode;
    private String lookupUrl;
    private String qrCodeBase64;
}
