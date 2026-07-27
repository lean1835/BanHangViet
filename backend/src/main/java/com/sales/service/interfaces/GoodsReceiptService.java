package com.sales.service.interfaces;

import com.sales.dto.request.CreateGoodsReceiptRequest;
import com.sales.dto.response.GoodsReceiptDetailInfoResponse;
import com.sales.dto.response.GoodsReceiptResponse;
import com.sales.dto.response.PageResponse;

public interface GoodsReceiptService {
    GoodsReceiptResponse createGoodsReceipt(String currentUsername, CreateGoodsReceiptRequest request);
    PageResponse<GoodsReceiptResponse> getGoodsReceipts(String currentUsername, int page, int size);
    GoodsReceiptDetailInfoResponse getGoodsReceiptById(String currentUsername, String id);
}
