package com.sales.modules.tax.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxPeriodChecklistResponse {
    private boolean salesRegisterGenerated;
    private String salesRegisterUrl;

    private boolean purchaseRegisterGenerated;
    private String purchaseRegisterUrl;

    private boolean declarationExported;
    private String declarationExportUrl;

    private boolean periodLocked;
    private String periodLockUrl;
}
