package com.sales.service.interfaces;

import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.response.BarcodeScanResponse;

public interface BarcodeService {

    BarcodeScanResponse scanBarcode(String currentUsername, BarcodeScanRequest request);
}
