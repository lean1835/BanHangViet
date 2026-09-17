package com.sales.service.interfaces;

import com.sales.dto.response.ImportCustomerResultResponse;
import com.sales.dto.response.ImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface CustomerImportService {

    byte[] getImportTemplate();

    ImportPreviewResponse previewImport(String currentUsername, MultipartFile file);

    ImportCustomerResultResponse importCustomers(String currentUsername, MultipartFile file, String duplicateAction);
}
