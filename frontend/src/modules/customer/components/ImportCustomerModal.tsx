import React from "react";
import { ImportCustomerSupplierModal } from "./ImportCustomerSupplierModal";

interface ImportCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (count: number) => void;
}

/**
 * Chức năng NCL-09-CN-009: Nhập danh mục khách hàng từ tệp Excel / CSV
 * Tách biệt hoàn toàn với chức năng nhập nhà cung cấp, được gọi trong tab Khách hàng.
 */
export const ImportCustomerModal: React.FC<ImportCustomerModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  return (
    <ImportCustomerSupplierModal
      isOpen={isOpen}
      onClose={onClose}
      type="CUSTOMER"
      allowTypeSwitch={false}
      onImportSuccess={onImportSuccess}
    />
  );
};
