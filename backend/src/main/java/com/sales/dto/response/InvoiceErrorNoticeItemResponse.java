package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceErrorNoticeItemResponse {

    private String id;
    private String invoiceId;
    private String invoiceNumber;
    private String invoicePattern;
    private String invoiceSymbol;
    private String taxAuthorityCode;
    private String handlingType;
    private String reason;
    private LocalDateTime createdAt;
}
