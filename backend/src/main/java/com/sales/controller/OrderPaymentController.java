package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.response.OrderPaymentResponse;
import com.sales.service.interfaces.OrderPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/payments")
@RequiredArgsConstructor
@Tag(name = "Order Payments", description = "Quản lý chi tiết thanh toán và xác nhận chuyển khoản ngân hàng (NCL-03-CN-011 & NCL-03-CN-012)")
public class OrderPaymentController {

    private final OrderPaymentService orderPaymentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    @Operation(summary = "Lấy chi tiết các hình thức thanh toán của đơn hàng")
    public ResponseEntity<ApiResponse<List<OrderPaymentResponse>>> getOrderPayments(
            Principal principal,
            @PathVariable String orderId) {
        List<OrderPaymentResponse> result = orderPaymentService.getOrderPayments(principal.getName(), orderId);
        ApiResponse<List<OrderPaymentResponse>> response = ApiResponse.<List<OrderPaymentResponse>>builder()
                .code(1000)
                .message("Lấy chi tiết thanh toán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{paymentId}/confirm-bank-transfer")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    @Operation(summary = "Xác nhận giao dịch chuyển khoản ngân hàng (NCL-03-CN-012)")
    public ResponseEntity<ApiResponse<OrderPaymentResponse>> confirmBankTransfer(
            Principal principal,
            @PathVariable String orderId,
            @PathVariable String paymentId,
            @Valid @RequestBody ConfirmBankTransferRequest request) {
        OrderPaymentResponse result = orderPaymentService.confirmBankTransfer(principal.getName(), orderId, paymentId, request);
        ApiResponse<OrderPaymentResponse> response = ApiResponse.<OrderPaymentResponse>builder()
                .code(1000)
                .message("Xác nhận chuyển khoản ngân hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/confirm-bank-transfer")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    @Operation(summary = "Xác nhận giao dịch chuyển khoản ngân hàng của đơn hàng (NCL-03-CN-012)")
    public ResponseEntity<ApiResponse<OrderPaymentResponse>> confirmOrderBankTransfer(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody ConfirmBankTransferRequest request) {
        OrderPaymentResponse result = orderPaymentService.confirmOrderBankTransfer(principal.getName(), orderId, request);
        ApiResponse<OrderPaymentResponse> response = ApiResponse.<OrderPaymentResponse>builder()
                .code(1000)
                .message("Xác nhận chuyển khoản ngân hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}

