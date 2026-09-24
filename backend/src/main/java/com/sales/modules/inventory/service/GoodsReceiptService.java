package com.sales.modules.inventory.service;
import com.sales.modules.inventory.dto.request.CreateGoodsReceiptRequest;
import com.sales.modules.inventory.dto.response.GoodsReceiptDetailInfoResponse;
import com.sales.modules.inventory.dto.response.GoodsReceiptResponse;
import com.sales.common.dto.PageResponse;

public interface GoodsReceiptService {
    GoodsReceiptResponse createGoodsReceipt(String currentUsername, CreateGoodsReceiptRequest request);
    PageResponse<GoodsReceiptResponse> getGoodsReceipts(String currentUsername, int page, int size);
    GoodsReceiptDetailInfoResponse getGoodsReceiptById(String currentUsername, String id);
}
