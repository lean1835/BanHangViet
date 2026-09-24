package com.sales.modules.product.service;
import com.sales.common.constant.BatchStatus;
import com.sales.modules.product.dto.request.ApplyPriceAdjustmentRequest;
import com.sales.modules.product.dto.request.PreviewPriceAdjustmentRequest;
import com.sales.modules.product.dto.request.RevertPriceAdjustmentRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.product.dto.response.PriceAdjustmentBatchResponse;
import com.sales.modules.product.dto.response.PriceAdjustmentPreviewResponse;

public interface PriceAdjustmentService {

    PriceAdjustmentPreviewResponse previewPriceAdjustment(String username, PreviewPriceAdjustmentRequest request);

    PriceAdjustmentBatchResponse applyPriceAdjustment(String username, ApplyPriceAdjustmentRequest request);

    PriceAdjustmentBatchResponse revertPriceAdjustment(String username, String batchId, RevertPriceAdjustmentRequest request);

    PageResponse<PriceAdjustmentBatchResponse> getPriceAdjustmentBatches(String username, BatchStatus status, int page, int size);

    PriceAdjustmentBatchResponse getPriceAdjustmentBatchById(String username, String batchId);
}
