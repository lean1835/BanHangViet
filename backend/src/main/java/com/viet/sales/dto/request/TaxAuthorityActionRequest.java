package com.viet.sales.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxAuthorityActionRequest {
    private String taxAuthorityCode;
    private String errorMessage;
}
