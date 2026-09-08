package com.sales.service.interfaces;

import com.sales.constant.BatchStatus;
import com.sales.dto.request.ApplyPriceAdjustmentRequest;
import com.sales.dto.request.PreviewPriceAdjustmentRequest;
import com.sales.dto.request.RevertPriceAdjustmentRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PriceAdjustmentBatchResponse;
import com.sales.dto.response.PriceAdjustmentPreviewResponse;

public interface PriceAdjustmentService {

    PriceAdjustmentPreviewResponse previewPriceAdjustment(String username, PreviewPriceAdjustmentRequest request);

    PriceAdjustmentBatchResponse applyPriceAdjustment(String username, ApplyPriceAdjustmentRequest request);

    PriceAdjustmentBatchResponse revertPriceAdjustment(String username, String batchId, RevertPriceAdjustmentRequest request);

    PageResponse<PriceAdjustmentBatchResponse> getPriceAdjustmentBatches(String username, BatchStatus status, int page, int size);

    PriceAdjustmentBatchResponse getPriceAdjustmentBatchById(String username, String batchId);
}
