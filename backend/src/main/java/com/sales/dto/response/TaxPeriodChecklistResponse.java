package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxPeriodChecklistResponse {
    // 1. Bảng kê hóa đơn bán ra (NCL-12-CN-001)
    private boolean salesRegisterGenerated;
    private String salesRegisterUrl;

    // 2. Bảng kê hàng hóa mua vào (NCL-12-CN-006)
    private boolean purchaseRegisterGenerated;
    private String purchaseRegisterUrl;

    // 3. Xuất tờ khai thuế mẫu 01/CNKD (NCL-12-CN-003)
    private boolean declarationExported;
    private String declarationExportUrl;

    // 4. Chốt kỳ kê khai & khóa số liệu (NCL-12-CN-004)
    private boolean periodLocked;
    private String periodLockUrl;
}
