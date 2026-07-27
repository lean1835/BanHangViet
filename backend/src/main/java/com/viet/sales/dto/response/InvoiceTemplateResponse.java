package com.viet.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceTemplateResponse {
    private String id;
    private String householdId;
    private String invoicePattern;
    private String invoiceSymbol;
    private String title;
    private String footerNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
