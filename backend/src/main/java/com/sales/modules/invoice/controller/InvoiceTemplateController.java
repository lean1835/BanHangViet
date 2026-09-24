package com.sales.modules.invoice.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.invoice.dto.request.InvoiceTemplateRequest;
import com.sales.modules.invoice.dto.response.InvoiceTemplateResponse;
import com.sales.modules.invoice.service.InvoiceTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/invoice-templates")
@RequiredArgsConstructor
public class InvoiceTemplateController {

    private final InvoiceTemplateService invoiceTemplateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> getTemplate(Principal principal) {
        InvoiceTemplateResponse result = invoiceTemplateService.getTemplateByHousehold(principal.getName());
        ApiResponse<InvoiceTemplateResponse> response = ApiResponse.<InvoiceTemplateResponse>builder()
                .code(1000)
                .message("Lấy cấu hình mẫu hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> updateTemplate(
            Principal principal,
            @Valid @RequestBody InvoiceTemplateRequest request) {
        InvoiceTemplateResponse result = invoiceTemplateService.updateTemplate(principal.getName(), request);
        ApiResponse<InvoiceTemplateResponse> response = ApiResponse.<InvoiceTemplateResponse>builder()
                .code(1000)
                .message("Cập nhật cấu hình mẫu hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
