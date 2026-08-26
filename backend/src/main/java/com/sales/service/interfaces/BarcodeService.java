package com.sales.service.interfaces;

import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.response.BarcodeResponse;
import com.sales.dto.response.BarcodeScanResponse;

public interface BarcodeService {

    BarcodeScanResponse scanBarcode(String currentUsername, BarcodeScanRequest request);

    BarcodeResponse generateInternalBarcode(String currentUsername, String productId);

    BarcodeResponse assignBarcode(String currentUsername, String productId, AssignBarcodeRequest request);

    BarcodeResponse getBarcodePrintData(String currentUsername, String productId, String paperSize, Integer quantity);
}
