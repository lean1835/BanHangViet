package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.StockCardResponse;
import com.sales.service.interfaces.StockCardService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Validated
public class StockCardController {

    private final StockCardService stockCardService;

    @GetMapping("/{productId}/stock-card")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<StockCardResponse>> getStockCard(
            Principal principal,
            @PathVariable("productId") String productId,
            @RequestParam(value = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(value = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(value = "page", defaultValue = "0") @Min(0) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) @Max(500) int size) {
        StockCardResponse result = stockCardService.getStockCard(
                principal.getName(), productId, fromDate, toDate, page, size);

        ApiResponse<StockCardResponse> response = ApiResponse.<StockCardResponse>builder()
                .code(1000)
                .message("Lấy thông tin thẻ kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
