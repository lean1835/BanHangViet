package com.viet.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceStatusLogResponse {
    private String id;
    private String invoiceId;
    private String fromStatus;
    private String toStatus;
    private String changedByUserId;
    private String changedByFullName;
    private String notes;
    private LocalDateTime createdAt;
}
