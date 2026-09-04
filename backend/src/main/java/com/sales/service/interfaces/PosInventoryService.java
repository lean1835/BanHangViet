package com.sales.service.interfaces;

import com.sales.dto.request.InitPosInventoryRequest;
import com.sales.dto.request.UpdatePosInventoryRequest;
import com.sales.dto.response.PosInventoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface PosInventoryService {

    Page<PosInventoryResponse> getInventoriesByPos(
            String currentUsername, String posId, String keyword, String groupId, Boolean lowStockOnly, Pageable pageable);

    PosInventoryResponse getInventoryByPosAndProduct(String currentUsername, String posId, String productId);

    List<PosInventoryResponse> initOrUpdatePosInventories(
            String currentUsername, String posId, InitPosInventoryRequest request);

    PosInventoryResponse updatePosInventory(
            String currentUsername, String posId, String productId, UpdatePosInventoryRequest request);

    List<PosInventoryResponse> getLowStockWarningsByPos(String currentUsername, String posId);

    void checkAndDeductPosStock(String householdId, String posId, String productId, BigDecimal quantity);

    void batchDeductPosStock(String householdId, String posId, java.util.Map<String, BigDecimal> productQuantities);

    void restorePosStock(String householdId, String posId, String productId, BigDecimal quantity);
}
