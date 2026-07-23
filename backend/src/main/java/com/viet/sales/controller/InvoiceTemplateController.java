package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.InvoiceTemplateRequest;
import com.viet.sales.dto.response.InvoiceTemplateResponse;
import com.viet.sales.service.interfaces.InvoiceTemplateService;
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

    @GetMapping({"", "/my-template"})
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceTemplateResponse>> getTemplate(Principal principal) {
        InvoiceTemplateResponse result = invoiceTemplateService.getTemplateByHousehold(principal.getName());
        ApiResponse<InvoiceTemplateResponse> response = ApiResponse.<InvoiceTemplateResponse>builder()
                .code(1000)
                .message("Lấy cấu hình mẫu hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping({"", "/my-template"})
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
