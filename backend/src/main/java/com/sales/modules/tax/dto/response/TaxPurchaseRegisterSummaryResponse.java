package com.sales.modules.tax.dto.response;
import com.sales.modules.supplier.dto.response.SupplierPurchaseGroupResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxPurchaseRegisterSummaryResponse {
    private String periodId;
    private String periodName;
    private String periodType;
    private Integer year;
    private Integer periodNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Boolean isLocked;

    private List<SupplierPurchaseGroupResponse> validSuppliers;

    private SupplierPurchaseGroupResponse unidentifiedSuppliers;

    private Boolean hasMissingSupplierReceipts;
    private Integer missingSupplierReceiptCount;
    private String warningMessage;

    private BigDecimal grandTotalQuantity;
    private BigDecimal grandTotalAmount;
    private BigDecimal eligibleForTaxDeductionAmount;
    private Integer totalReceiptCount;
}
