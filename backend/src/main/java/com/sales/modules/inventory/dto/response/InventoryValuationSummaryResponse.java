package com.sales.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryValuationSummaryResponse {
    private LocalDate asOfDate;                 // Ngày chốt số liệu báo cáo
    private Boolean isHistorical;               // true: ngày quá khứ, false: thời điểm hiện tại
    private Long totalProducts;                 // Tổng số mặt hàng trong kho
    private Long valuedProductsCount;           // Số mặt hàng CÓ giá vốn (tính vào định giá)
    private Long missingCostProductsCount;      // Số mặt hàng CHƯA CÓ giá vốn (tách riêng cảnh báo)
    private BigDecimal totalStockQuantity;      // Tổng số lượng tồn kho (của các mặt hàng có giá vốn)
    private BigDecimal missingCostStockQuantity;// Tổng số lượng tồn kho (của các mặt hàng thiếu giá vốn)
    private BigDecimal totalInventoryValue;     // Tổng giá trị tồn kho theo giá vốn (SUM(stock * costPrice))
    private BigDecimal totalRetailValue;        // Tổng giá trị tồn kho theo giá bán (SUM(stock * price))
    private BigDecimal potentialGrossProfit;    // Lãi gộp tiềm năng = totalRetailValue - totalInventoryValue
    private BigDecimal potentialProfitMargin;   // Tỷ suất lãi tiềm năng = (potentialGrossProfit / totalRetailValue) * 100
    private Long averageDaysInStock;            // Số ngày tồn kho trung bình toàn kho (Weighted Average Days)
}
