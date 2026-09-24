package com.sales.modules.product.service;
import com.sales.modules.product.dto.request.AssignBarcodeRequest;
import com.sales.modules.product.dto.request.BarcodeScanRequest;
import com.sales.modules.product.dto.response.BarcodeResponse;
import com.sales.modules.product.dto.response.BarcodeScanResponse;

public interface BarcodeService {

    BarcodeScanResponse scanBarcode(String currentUsername, BarcodeScanRequest request);

    BarcodeResponse generateInternalBarcode(String currentUsername, String productId);

    BarcodeResponse assignBarcode(String currentUsername, String productId, AssignBarcodeRequest request);

    BarcodeResponse getBarcodePrintData(String currentUsername, String productId, String paperSize, Integer quantity);
}
