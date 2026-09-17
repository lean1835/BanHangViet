package com.sales.service.interfaces;

import com.sales.dto.response.ImportPreviewResponse;
import com.sales.dto.response.ImportSupplierResultResponse;
import org.springframework.web.multipart.MultipartFile;

public interface SupplierImportService {

    byte[] getImportTemplate();

    ImportPreviewResponse previewImport(String currentUsername, MultipartFile file);

    ImportSupplierResultResponse importSuppliers(String currentUsername, MultipartFile file, String duplicateAction);
}
