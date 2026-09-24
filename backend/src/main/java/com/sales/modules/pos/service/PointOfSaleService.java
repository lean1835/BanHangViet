package com.sales.modules.pos.service;
import com.sales.modules.pos.dto.request.PointOfSaleRequest;
import com.sales.modules.pos.dto.response.PointOfSaleResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PointOfSaleService {

    PointOfSaleResponse createPointOfSale(String currentUsername, PointOfSaleRequest request);

    PointOfSaleResponse updatePointOfSale(String currentUsername, String posId, PointOfSaleRequest request);

    PointOfSaleResponse getPointOfSaleById(String currentUsername, String posId);

    Page<PointOfSaleResponse> getAllPointsOfSale(String currentUsername, String keyword, Boolean isActive, Pageable pageable);

    List<PointOfSaleResponse> getActivePointsOfSale(String currentUsername);

    PointOfSaleResponse setDefaultPointOfSale(String currentUsername, String posId);

    void deletePointOfSale(String currentUsername, String posId);
}
