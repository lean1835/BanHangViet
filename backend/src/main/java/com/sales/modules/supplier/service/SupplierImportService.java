package com.sales.modules.supplier.service;
import com.sales.modules.product.dto.response.ImportPreviewResponse;
import com.sales.modules.supplier.dto.response.ImportSupplierResultResponse;
import org.springframework.web.multipart.MultipartFile;

public interface SupplierImportService {

    byte[] getImportTemplate();

    ImportPreviewResponse previewImport(String currentUsername, MultipartFile file);

    ImportSupplierResultResponse importSuppliers(String currentUsername, MultipartFile file, String duplicateAction);
}
