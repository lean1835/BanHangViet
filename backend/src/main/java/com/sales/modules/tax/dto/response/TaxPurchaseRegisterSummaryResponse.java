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
    private String status; // DRAFT, GENERATED, LOCKED
    private Boolean isLocked;

    // Danh sách các nhóm NCC hợp lệ kèm chi tiết và Subtotal (TC-01)
    private List<SupplierPurchaseGroupResponse> validSuppliers;

    // Nhóm gom riêng các phiếu thiếu thông tin NCC (TC-02)
    private SupplierPurchaseGroupResponse unidentifiedSuppliers;

    // Cảnh báo chứng từ thiếu NCC
    private Boolean hasMissingSupplierReceipts;
    private Integer missingSupplierReceiptCount;
    private String warningMessage;

    // Các chỉ số tổng toàn kỳ
    private BigDecimal grandTotalQuantity;
    private BigDecimal grandTotalAmount;
    private BigDecimal eligibleForTaxDeductionAmount; // Tổng tiền hợp lệ đủ điều kiện kê khai
    private Integer totalReceiptCount;
}
