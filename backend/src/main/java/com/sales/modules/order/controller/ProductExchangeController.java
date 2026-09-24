package com.sales.modules.order.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.order.dto.request.CheckExchangeEligibilityRequest;
import com.sales.modules.order.dto.request.CreateProductExchangeRequest;
import com.sales.modules.order.dto.response.ExchangeEligibilityResponse;
import com.sales.modules.order.dto.response.ProductExchangeResponse;
import com.sales.modules.order.service.ProductExchangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/product-exchanges")
@RequiredArgsConstructor
public class ProductExchangeController {

    private final ProductExchangeService productExchangeService;

    @PostMapping("/check-eligibility")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ExchangeEligibilityResponse>> checkEligibility(
            Principal principal,
            @Valid @RequestBody CheckExchangeEligibilityRequest request) {
        ExchangeEligibilityResponse result = productExchangeService.checkEligibility(request, principal.getName());
        ApiResponse<ExchangeEligibilityResponse> response = ApiResponse.<ExchangeEligibilityResponse>builder()
                .code(1000)
                .message("Kiểm tra điều kiện đổi hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ProductExchangeResponse>> createProductExchange(
            Principal principal,
            @Valid @RequestBody CreateProductExchangeRequest request) {
        ProductExchangeResponse result = productExchangeService.createProductExchange(request, principal.getName());
        ApiResponse<ProductExchangeResponse> response = ApiResponse.<ProductExchangeResponse>builder()
                .code(1000)
                .message("Lập phiếu đổi hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<ProductExchangeResponse>> getExchangeTicketById(
            Principal principal,
            @PathVariable String id) {
        ProductExchangeResponse result = productExchangeService.getExchangeTicketById(id, principal.getName());
        ApiResponse<ProductExchangeResponse> response = ApiResponse.<ProductExchangeResponse>builder()
                .code(1000)
                .message("Lấy thông tin phiếu đổi hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    private static final java.util.Set<String> ALLOWED_SORT_FIELDS = java.util.Set.of(
            "createdAt", "ticketNumber", "totalExchangeAmount", "totalReturnAmount", "differenceAmount", "status"
    );

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Page<ProductExchangeResponse>>> getExchangeTickets(
            Principal principal,
            @RequestParam(required = false) String invoiceId,
            @RequestParam(required = false) String exchangeType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String sortProperty = sortParts[0].trim();
        if (!ALLOWED_SORT_FIELDS.contains(sortProperty)) {
            sortProperty = "createdAt";
        }
        Sort.Direction direction = sortParts.length > 1 && "asc".equalsIgnoreCase(sortParts[1].trim())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortProperty));

        Page<ProductExchangeResponse> result = productExchangeService.getExchangeTickets(
                invoiceId,
                exchangeType,
                status,
                pageable,
                principal.getName()
        );

        ApiResponse<Page<ProductExchangeResponse>> response = ApiResponse.<Page<ProductExchangeResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiếu đổi hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
