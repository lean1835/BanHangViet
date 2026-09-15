package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingCostProductResponse {
    private String productId;                   // ID sản phẩm
    private String sku;                         // Mã SKU
    private String productName;                 // Tên mặt hàng
    private String unit;                        // Đơn vị tính
    private String groupId;                     // ID nhóm hàng
    private String groupName;                   // Tên nhóm hàng
    private BigDecimal stockQuantity;           // Số lượng tồn kho
    private BigDecimal retailPrice;             // Giá bán
    private String warningMessage;              // Cảnh báo: "Chưa có giá vốn từ phiếu nhập (loại trừ khỏi tổng giá trị tồn kho)"
}
