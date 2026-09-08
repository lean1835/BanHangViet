package com.sales.constant;

/**
 * Định nghĩa các loại chứng từ phát sinh biến động trong thẻ kho (NCL-02-CN-006).
 */
public final class StockMovementType {
    public static final String GOODS_RECEIPT = "GOODS_RECEIPT";
    public static final String SALE_ORDER = "SALE_ORDER";
    public static final String CUSTOMER_RETURN = "CUSTOMER_RETURN";
    public static final String INVENTORY_AUDIT = "INVENTORY_AUDIT";
    public static final String INITIAL_STOCK = "INITIAL_STOCK";
    public static final String SUPPLIER_RETURN = "SUPPLIER_RETURN"; // Dự phòng cho NCL-13-CN-006

    private StockMovementType() {
        // Private constructor to prevent instantiation
    }
}
