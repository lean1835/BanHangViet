package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CreateGoodsReceiptRequest;
import com.viet.sales.dto.response.GoodsReceiptDetailInfoResponse;
import com.viet.sales.dto.response.GoodsReceiptResponse;
import com.viet.sales.dto.response.PageResponse;

public interface GoodsReceiptService {
    GoodsReceiptResponse createGoodsReceipt(String currentUsername, CreateGoodsReceiptRequest request);
    PageResponse<GoodsReceiptResponse> getGoodsReceipts(String currentUsername, int page, int size);
    GoodsReceiptDetailInfoResponse getGoodsReceiptById(String currentUsername, String id);
}
