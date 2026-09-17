import React from "react";
import { ImportCustomerSupplierModal } from "@/modules/customer/components/ImportCustomerSupplierModal";

interface ImportSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

/**
 * Chức năng NCL-09-CN-009: Nhập danh mục nhà cung cấp từ tệp Excel / CSV
 * Tách biệt hoàn toàn với chức năng nhập khách hàng, được gọi trong trang Quản lý Nhà cung cấp.
 */
export const ImportSupplierModal: React.FC<ImportSupplierModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  return (
    <ImportCustomerSupplierModal
      isOpen={isOpen}
      onClose={onClose}
      type="SUPPLIER"
      allowTypeSwitch={false}
      onImportSuccess={onImportSuccess}
    />
  );
};
