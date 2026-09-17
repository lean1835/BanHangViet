package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateCustomerRequest;
import com.sales.dto.request.UpdateCustomerRequest;
import com.sales.dto.response.CustomerResponse;
import com.sales.service.interfaces.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final com.sales.service.interfaces.CustomerImportService customerImportService;

    @GetMapping("/import-template")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<byte[]> getImportTemplate() {
        byte[] data = customerImportService.getImportTemplate();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mau_nhap_khach_hang.xlsx")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(data);
    }

    @PostMapping("/import-preview")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<com.sales.dto.response.ImportPreviewResponse>> previewImport(
            Principal principal,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        com.sales.dto.response.ImportPreviewResponse preview = customerImportService.previewImport(principal.getName(), file);
        return ResponseEntity.ok(ApiResponse.<com.sales.dto.response.ImportPreviewResponse>builder()
                .code(1000)
                .message("Phân tích tệp dữ liệu khách hàng thành công")
                .result(preview)
                .build());
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<com.sales.dto.response.ImportCustomerResultResponse>> importCustomers(
            Principal principal,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "duplicateAction", defaultValue = "SKIP") String duplicateAction) {
        com.sales.dto.response.ImportCustomerResultResponse result = customerImportService.importCustomers(principal.getName(), file, duplicateAction);
        return ResponseEntity.ok(ApiResponse.<com.sales.dto.response.ImportCustomerResultResponse>builder()
                .code(1000)
                .message("Nhập danh mục khách hàng từ tệp thành công")
                .result(result)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            Principal principal,
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse result = customerService.createCustomer(principal.getName(), request);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Tạo khách hàng thân thiết thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse result = customerService.updateCustomer(principal.getName(), id, request);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomer(
            Principal principal,
            @PathVariable String id) {
        CustomerResponse result = customerService.getCustomer(principal.getName(), id);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Lấy thông tin khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getCustomers(Principal principal) {
        List<CustomerResponse> result = customerService.getCustomers(principal.getName());
        ApiResponse<List<CustomerResponse>> response = ApiResponse.<List<CustomerResponse>>builder()
                .code(1000)
                .message("Lấy danh sách khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> searchCustomers(
            Principal principal,
            @RequestParam String query) {
        List<CustomerResponse> result = customerService.searchCustomers(principal.getName(), query);
        ApiResponse<List<CustomerResponse>> response = ApiResponse.<List<CustomerResponse>>builder()
                .code(1000)
                .message("Tìm kiếm khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/delivery-channel")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomerDeliveryChannel(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody com.sales.dto.request.UpdateCustomerDeliveryChannelRequest request) {
        CustomerResponse result = customerService.updateDefaultDeliveryChannel(principal.getName(), id, request);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Cập nhật kênh nhận hóa đơn mặc định của khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(
            Principal principal,
            @PathVariable String id) {
        customerService.deleteCustomer(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa khách hàng thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
