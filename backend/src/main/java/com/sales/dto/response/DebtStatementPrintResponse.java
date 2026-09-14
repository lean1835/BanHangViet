package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtStatementPrintResponse {
    private String documentTitle; // "GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ"
    private String reconciliationCode;
    private LocalDate printedDate;
    
    // Thông tin Hộ kinh doanh (Bên Bán)
    private String householdName;
    private String householdTaxCode;
    private String householdAddress;
    private String householdPhone;
    private String householdRepresentative;

    // Thông tin Khách hàng (Bên Mua)
    private String customerName;
    private String customerPhone;
    private String customerTaxCode;
    private String customerAddress;

    // Kỳ đối chiếu
    private LocalDate startDate;
    private LocalDate endDate;

    // Số dư
    private BigDecimal openingDebtBalance;
    private BigDecimal totalDebtIncurred;
    private BigDecimal totalDebtPaid;
    private BigDecimal closingDebtBalance;
    private String closingDebtInWords;

    private boolean hasTransactions;
    private String notes;

    // Danh sách giao dịch chi tiết
    private List<DebtReconciliationItemResponse> transactions;

    // Chữ ký đại diện
    private String sellerSignTitle; // "ĐẠI DIỆN BÊN BÁN (Ký, ghi rõ họ tên)"
    private String buyerSignTitle;  // "ĐẠI DIỆN BÊN MUA (Ký, ghi rõ họ tên)"
}
