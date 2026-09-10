package com.sales.service.interfaces;

import com.sales.constant.CashTransactionType;
import com.sales.dto.request.CreateCashCategoryRequest;
import com.sales.dto.request.UpdateCashCategoryRequest;
import com.sales.dto.response.CashTransactionCategoryResponse;

import java.util.List;

public interface CashTransactionCategoryService {

    List<CashTransactionCategoryResponse> getCategories(String currentUsername, CashTransactionType type);

    CashTransactionCategoryResponse createCategory(String currentUsername, CreateCashCategoryRequest request);

    CashTransactionCategoryResponse updateCategory(String currentUsername, String categoryId, UpdateCashCategoryRequest request);

    void deleteCategory(String currentUsername, String categoryId);
}
