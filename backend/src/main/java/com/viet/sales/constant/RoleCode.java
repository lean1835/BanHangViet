package com.viet.sales.constant;

public enum RoleCode {
    VT_01("VT-01", "Chủ hộ kinh doanh"),
    VT_02("VT-02", "Nhân viên bán hàng"),
    VT_03("VT-03", "Kế toán"),
    VT_04("VT-04", "Quản trị nền tảng"),
    VT_05("VT-05", "Cơ quan thuế mô phỏng"),
    VT_06("VT-06", "Khách hàng");

    private final String code;
    private final String name;

    RoleCode(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }
}
