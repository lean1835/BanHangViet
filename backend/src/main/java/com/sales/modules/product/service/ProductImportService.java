package com.sales.modules.product.service;
import com.sales.modules.product.dto.response.ImportProductResultResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ProductImportService {

    byte[] getImportTemplate() throws Exception;

    ImportProductResultResponse importProducts(String currentUsername, MultipartFile file);
}
