package com.sales.modules.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductGroupValuationResponse {
    private String groupId;                     // ID nhóm hàng (null nếu chưa phân nhóm)
    private String groupName;                   // Tên nhóm hàng (mặc định "Chưa phân nhóm")
    private Integer productCount;               // Số mặt hàng trong nhóm có giá vốn
    private BigDecimal totalStockQuantity;      // Tổng số lượng tồn của nhóm
    private BigDecimal totalInventoryValue;     // Tổng giá trị tồn kho theo giá vốn của nhóm
    private BigDecimal totalRetailValue;        // Tổng giá trị theo giá bán của nhóm
    private BigDecimal valuePercentage;         // Tỷ trọng % giá trị vốn nhóm so với toàn kho
    private Long averageDaysInStock;            // Số ngày tồn trung bình của nhóm
}
