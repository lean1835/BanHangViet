package com.sales.controller;

import com.sales.constant.PosTransferStatus;
import com.sales.dto.ApiResponse;
import com.sales.dto.request.CancelPosTransferRequest;
import com.sales.dto.request.CreatePosTransferRequest;
import com.sales.dto.response.PosTransferResponse;
import com.sales.service.interfaces.PosTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/pos-transfers")
@RequiredArgsConstructor
public class PosTransferController {

    private final PosTransferService posTransferService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PosTransferResponse>> createTransfer(
            Principal principal,
            @Valid @RequestBody CreatePosTransferRequest request) {

        PosTransferResponse result = posTransferService.createTransfer(principal.getName(), request);
        ApiResponse<PosTransferResponse> response = ApiResponse.<PosTransferResponse>builder()
                .code(1000)
                .message("Lập phiếu chuyển hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Page<PosTransferResponse>>> getTransfers(
            Principal principal,
            @RequestParam(required = false) String fromPosId,
            @RequestParam(required = false) String toPosId,
            @RequestParam(required = false) PosTransferStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "transferredAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PosTransferResponse> result = posTransferService.getTransfers(
                principal.getName(), fromPosId, toPosId, status, keyword, fromDate, toDate, pageable);

        ApiResponse<Page<PosTransferResponse>> response = ApiResponse.<Page<PosTransferResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiếu chuyển hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PosTransferResponse>> getTransferById(
            Principal principal,
            @PathVariable String id) {

        PosTransferResponse result = posTransferService.getTransferById(principal.getName(), id);
        ApiResponse<PosTransferResponse> response = ApiResponse.<PosTransferResponse>builder()
                .code(1000)
                .message("Lấy chi tiết phiếu chuyển hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PosTransferResponse>> receiveTransfer(
            Principal principal,
            @PathVariable String id) {

        PosTransferResponse result = posTransferService.receiveTransfer(principal.getName(), id);
        ApiResponse<PosTransferResponse> response = ApiResponse.<PosTransferResponse>builder()
                .code(1000)
                .message("Xác nhận nhận hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PosTransferResponse>> cancelTransfer(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody CancelPosTransferRequest request) {

        PosTransferResponse result = posTransferService.cancelTransfer(principal.getName(), id, request);
        ApiResponse<PosTransferResponse> response = ApiResponse.<PosTransferResponse>builder()
                .code(1000)
                .message("Hủy phiếu chuyển hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
