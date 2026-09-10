package com.sales.controller;

import com.sales.dto.request.CreateCashTransactionRequest;
import com.sales.dto.request.RejectCashExpenseRequest;
import com.sales.dto.request.UpdateExpenseThresholdRequest;
import com.sales.dto.ApiResponse;
import com.sales.dto.response.CashTransactionResponse;
import com.sales.dto.response.ShiftCashSummaryResponse;
import com.sales.service.interfaces.CashTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cash-transactions")
@RequiredArgsConstructor
@Tag(name = "Cash Transactions", description = "Ghi thu chi tiền mặt ngoài bán hàng trong ca (NCL-03-CN-014)")
public class CashTransactionController {

    private final CashTransactionService cashTransactionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    @Operation(summary = "Lập phiếu thu hoặc phiếu chi tiền mặt trong ca mở")
    public ResponseEntity<ApiResponse<CashTransactionResponse>> createTransaction(
            Authentication authentication,
            @Valid @RequestBody CreateCashTransactionRequest request) {
        CashTransactionResponse result = cashTransactionService.createTransaction(authentication.getName(), request);
        String message = "Lập phiếu " + (request.getType().name().equals("INCOME") ? "thu" : "chi") + " tiền mặt thành công";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CashTransactionResponse>builder()
                .code(1000)
                .message(message)
                .result(result)
                .build());
    }

    @GetMapping("/current-shift")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    @Operation(summary = "Lấy danh sách phiếu thu chi trong ca đang mở của nhân viên")
    public ResponseEntity<ApiResponse<List<CashTransactionResponse>>> getCurrentShiftTransactions(
            Authentication authentication) {
        List<CashTransactionResponse> result = cashTransactionService.getCurrentShiftTransactions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<List<CashTransactionResponse>>builder()
                .code(1000)
                .message("Thành công")
                .result(result)
                .build());
    }

    @GetMapping("/shift/{shiftId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Lấy danh sách phiếu thu chi của một ca cụ thể")
    public ResponseEntity<ApiResponse<List<CashTransactionResponse>>> getShiftTransactions(
            Authentication authentication,
            @PathVariable String shiftId) {
        List<CashTransactionResponse> result = cashTransactionService.getShiftTransactions(authentication.getName(), shiftId);
        return ResponseEntity.ok(ApiResponse.<List<CashTransactionResponse>>builder()
                .code(1000)
                .message("Thành công")
                .result(result)
                .build());
    }

    @GetMapping("/shift/{shiftId}/summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Lấy báo cáo tổng hợp dòng tiền mặt ngoài bán hàng trong ca")
    public ResponseEntity<ApiResponse<ShiftCashSummaryResponse>> getShiftCashSummary(
            Authentication authentication,
            @PathVariable String shiftId) {
        ShiftCashSummaryResponse result = cashTransactionService.getShiftCashSummary(authentication.getName(), shiftId);
        return ResponseEntity.ok(ApiResponse.<ShiftCashSummaryResponse>builder()
                .code(1000)
                .message("Thành công")
                .result(result)
                .build());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Xem chi tiết một phiếu thu chi theo ID")
    public ResponseEntity<ApiResponse<CashTransactionResponse>> getTransactionById(
            Authentication authentication,
            @PathVariable String id) {
        CashTransactionResponse result = cashTransactionService.getTransactionById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.<CashTransactionResponse>builder()
                .code(1000)
                .message("Thành công")
                .result(result)
                .build());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Chủ hộ phê duyệt phiếu chi vượt hạn mức")
    public ResponseEntity<ApiResponse<CashTransactionResponse>> approveTransaction(
            Authentication authentication,
            @PathVariable String id) {
        CashTransactionResponse result = cashTransactionService.approveTransaction(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.<CashTransactionResponse>builder()
                .code(1000)
                .message("Phê duyệt phiếu chi thành công")
                .result(result)
                .build());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Chủ hộ từ chối phiếu chi")
    public ResponseEntity<ApiResponse<CashTransactionResponse>> rejectTransaction(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody RejectCashExpenseRequest request) {
        CashTransactionResponse result = cashTransactionService.rejectTransaction(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<CashTransactionResponse>builder()
                .code(1000)
                .message("Từ chối phiếu chi thành công")
                .result(result)
                .build());
    }

    @PutMapping("/threshold")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Chủ hộ cập nhật hạn mức chi tiền mặt tự duyệt của nhân viên")
    public ResponseEntity<ApiResponse<Void>> updateExpenseThreshold(
            Authentication authentication,
            @Valid @RequestBody UpdateExpenseThresholdRequest request) {
        cashTransactionService.updateExpenseThreshold(authentication.getName(), request.getExpenseApprovalThreshold());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Cập nhật hạn mức duyệt chi thành công")
                .build());
    }
}
