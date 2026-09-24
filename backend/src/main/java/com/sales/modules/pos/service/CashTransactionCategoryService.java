package com.sales.modules.pos.service;
import com.sales.common.constant.CashTransactionType;
import com.sales.modules.pos.dto.request.CreateCashCategoryRequest;
import com.sales.modules.pos.dto.request.UpdateCashCategoryRequest;
import com.sales.modules.pos.dto.response.CashTransactionCategoryResponse;

import java.util.List;

public interface CashTransactionCategoryService {

    List<CashTransactionCategoryResponse> getCategories(String currentUsername, CashTransactionType type);

    CashTransactionCategoryResponse createCategory(String currentUsername, CreateCashCategoryRequest request);

    CashTransactionCategoryResponse updateCategory(String currentUsername, String categoryId, UpdateCashCategoryRequest request);

    void deleteCategory(String currentUsername, String categoryId);
}
