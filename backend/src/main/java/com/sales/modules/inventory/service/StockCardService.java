package com.sales.modules.inventory.service;
import com.sales.modules.inventory.dto.response.StockCardResponse;

import java.time.LocalDate;

public interface StockCardService {

    StockCardResponse getStockCard(
            String username,
            String productId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    );
}
