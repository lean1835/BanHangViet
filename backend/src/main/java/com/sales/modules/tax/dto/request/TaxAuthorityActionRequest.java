package com.sales.modules.tax.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxAuthorityActionRequest {
    private String taxAuthorityCode;
    private String errorMessage;
}
