import { describe, expect, it } from "vitest";
import { SUPPLIER_STATUS } from "@/constants/supplier";
import { supplierGroupSchema, supplierSchema } from "./supplierSchema";

const VALID_SUPPLIER = {
  name: "Công ty Thực phẩm Việt",
  phoneNumber: "0912345678",
  email: "lienhe@thucphamviet.vn",
  groupId: "group-01",
  taxCode: "0123456789-001",
  address: "Quận 1, Thành phố Hồ Chí Minh",
  initialDebt: 1_500_000,
  note: "Giao hàng vào buổi sáng",
  status: SUPPLIER_STATUS.ACTIVE,
};

describe("supplierSchema", () => {
  it("chấp nhận và chuẩn hóa hồ sơ nhà cung cấp hợp lệ", () => {
    const result = supplierSchema.parse({
      ...VALID_SUPPLIER,
      name: "  Công ty Thực phẩm Việt  ",
      phoneNumber: "091 234 5678",
    });

    expect(result.name).toBe("Công ty Thực phẩm Việt");
    expect(result.phoneNumber).toBe("0912345678");
  });

  it("từ chối số điện thoại chứa ký tự không phải chữ số", () => {
    expect(
      supplierSchema.safeParse({
        ...VALID_SUPPLIER,
        phoneNumber: "+84912345678",
      }).success,
    ).toBe(false);
  });

  it("chấp nhận email, mã số thuế và nhóm để trống", () => {
    expect(
      supplierSchema.safeParse({
        ...VALID_SUPPLIER,
        email: "",
        taxCode: "",
        groupId: "",
      }).success,
    ).toBe(true);
  });

  it("từ chối mã số thuế sai cấu trúc", () => {
    expect(
      supplierSchema.safeParse({
        ...VALID_SUPPLIER,
        taxCode: "12345",
      }).success,
    ).toBe(false);
  });

  it("từ chối công nợ ban đầu âm", () => {
    expect(
      supplierSchema.safeParse({
        ...VALID_SUPPLIER,
        initialDebt: -1,
      }).success,
    ).toBe(false);
  });
});

describe("supplierGroupSchema", () => {
  it("chuẩn hóa tên và ghi chú nhóm", () => {
    expect(
      supplierGroupSchema.parse({ name: "  Nông sản  ", note: "  Ghi chú  " }),
    ).toEqual({ name: "Nông sản", note: "Ghi chú" });
  });

  it("không chấp nhận tên nhóm chỉ có khoảng trắng", () => {
    expect(supplierGroupSchema.safeParse({ name: "   ", note: "" }).success).toBe(
      false,
    );
  });
});
