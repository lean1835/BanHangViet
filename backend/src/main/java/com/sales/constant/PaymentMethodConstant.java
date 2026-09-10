package com.sales.constant;

public final class PaymentMethodConstant {
    private PaymentMethodConstant() {}

    public static final String CASH = "CASH";
    public static final String BANK_TRANSFER = "BANK_TRANSFER";
    public static final String DEBT = "DEBT";
    public static final String COMBINED = "COMBINED";

    public static boolean isValid(String method) {
        return CASH.equals(method) || BANK_TRANSFER.equals(method) || DEBT.equals(method);
    }
}
