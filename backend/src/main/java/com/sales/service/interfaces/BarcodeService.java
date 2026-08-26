package com.sales.service.interfaces;

import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.response.BarcodeResponse;

public interface BarcodeService {

    BarcodeResponse generateInternalBarcode(String currentUsername, String productId);

    BarcodeResponse assignBarcode(String currentUsername, String productId, AssignBarcodeRequest request);

    BarcodeResponse getBarcodePrintData(String currentUsername, String productId, String paperSize, Integer quantity);
}
