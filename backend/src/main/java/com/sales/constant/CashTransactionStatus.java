package com.sales.constant;

public enum CashTransactionStatus {
    APPROVED,          // Đã duyệt (được tính vào dòng tiền ca)
    PENDING_APPROVAL,  // Chờ chủ hộ duyệt (chưa được trừ vào tiền ca)
    REJECTED,          // Đã từ chối duyệt (không tính vào ca)
    CANCELLED          // Đã hủy bỏ
}
