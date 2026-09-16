package com.sales.dto.response;

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
public class InventoryValuationItemResponse {
    private String productId;                   // ID sản phẩm
    private String sku;                         // Mã SKU
    private String productName;                 // Tên mặt hàng
    private String unit;                        // Đơn vị tính
    private String groupId;                     // ID nhóm hàng
    private String groupName;                   // Tên nhóm hàng
    private BigDecimal stockQuantity;           // Số lượng tồn kho tại thời điểm asOfDate
    private BigDecimal costPrice;               // Giá vốn bình quân gia quyền (QTN-23)
    private BigDecimal inventoryValue;          // Giá trị tồn kho theo giá vốn = stockQuantity * costPrice
    private BigDecimal retailPrice;             // Giá niêm yết bán lẻ
    private BigDecimal retailValue;             // Giá trị theo giá bán = stockQuantity * retailPrice
    private LocalDate lastImportDate;           // Ngày nhập hàng gần nhất (hoặc ngày tạo)
    private Long daysInStock;                   // Số ngày tồn kho tính đến asOfDate
    private Boolean isNegativeStock;            // Cờ đánh dấu sản phẩm bị bán âm kho (stockQuantity < 0)
}
