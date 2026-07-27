package com.sales.service.interfaces;

import com.sales.dto.response.ImportProductResultResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ProductImportService {

    byte[] getImportTemplate() throws Exception;

    ImportProductResultResponse importProducts(String currentUsername, MultipartFile file);
}
