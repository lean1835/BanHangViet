package com.sales.modules.customer.service;
import com.sales.modules.customer.dto.response.ImportCustomerResultResponse;
import com.sales.modules.product.dto.response.ImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface CustomerImportService {

    byte[] getImportTemplate();

    ImportPreviewResponse previewImport(String currentUsername, MultipartFile file);

    ImportCustomerResultResponse importCustomers(String currentUsername, MultipartFile file, String duplicateAction);
}
