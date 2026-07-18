package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.*;
import com.viet.sales.dto.response.OrderResponse;
import com.viet.sales.service.interfaces.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Principal principal,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse result = orderService.createOrder(principal.getName(), request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Tạo đơn bán hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/items")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> addOrderItem(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody CreateOrderItemRequest request) {
        OrderResponse result = orderService.addOrderItem(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Thêm sản phẩm vào đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderItem(
            Principal principal,
            @PathVariable String orderId,
            @PathVariable String itemId,
            @Valid @RequestBody UpdateOrderItemRequest request) {
        OrderResponse result = orderService.updateOrderItem(principal.getName(), orderId, itemId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Cập nhật số lượng sản phẩm thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> deleteOrderItem(
            Principal principal,
            @PathVariable String orderId,
            @PathVariable String itemId) {
        OrderResponse result = orderService.deleteOrderItem(principal.getName(), orderId, itemId);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Xóa sản phẩm khỏi đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/discount")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> applyDiscount(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody ApplyDiscountRequest request) {
        OrderResponse result = orderService.applyDiscount(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Áp dụng giảm giá thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/payment")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> setPaymentMethod(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody OrderPaymentRequest request) {
        OrderResponse result = orderService.setPaymentMethod(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Cập nhật hình thức thanh toán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/complete")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> completeOrder(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody CompleteOrderRequest request) {
        OrderResponse result = orderService.completeOrder(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Chốt đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            Principal principal,
            @PathVariable String orderId) {
        OrderResponse result = orderService.getOrder(principal.getName(), orderId);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Lấy chi tiết đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
