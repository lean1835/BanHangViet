package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceErrorNoticeResponse {

    private String id;
    private String noticeCode;
    private String noticeType;
    private String noticePlace;
    private String taxAuthorityName;
    private String status; // DRAFT, WAITING_TAX_RESPONSE, ACCEPTED, REJECTED
    private String taxAuthorityCode;
    private String taxAuthorityResponse;
    private LocalDateTime sentToTaxAt;
    private LocalDateTime taxResponseAt;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private List<InvoiceErrorNoticeItemResponse> items;
}
