package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.*;
import com.sales.dto.response.*;
import com.sales.service.interfaces.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;


@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final com.sales.service.interfaces.OrderPaymentService orderPaymentService;

    @PostMapping

    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<OrderResponse>> setPaymentMethod(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody SetPaymentMethodRequest request) {
        OrderResponse result = orderService.setPaymentMethod(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Cập nhật hình thức thanh toán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/confirm-bank-transfer")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Xác nhận đã nhận tiền chuyển khoản ngân hàng trước khi chốt đơn (NCL-03-CN-012)")
    public ResponseEntity<ApiResponse<OrderPaymentResponse>> confirmBankTransfer(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody ConfirmBankTransferRequest request) {
        OrderPaymentResponse result = orderPaymentService.confirmOrderBankTransfer(principal.getName(), orderId, request);
        ApiResponse<OrderPaymentResponse> response = ApiResponse.<OrderPaymentResponse>builder()
                .code(1000)
                .message("Xác nhận đã nhận tiền chuyển khoản thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{orderId}/payment-method")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Đổi phương thức thanh toán linh hoạt khi khách hủy chuyển khoản (NCL-03-CN-012)")
    public ResponseEntity<ApiResponse<OrderResponse>> switchPaymentMethod(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody SwitchPaymentMethodRequest request) {
        OrderResponse result = orderService.switchPaymentMethod(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Đổi phương thức thanh toán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/complete")

    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersHistory(Principal principal) {
        List<OrderResponse> result = orderService.getOrdersHistory(principal.getName());
        ApiResponse<List<OrderResponse>> response = ApiResponse.<List<OrderResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Tính toán trọng lượng từ số tiền mua")
    @PostMapping("/calculate-weight")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<CalculateWeightResponse>> calculateWeight(
            Principal principal,
            @Valid @RequestBody CalculateWeightRequest request) {
        CalculateWeightResponse result = orderService.calculateWeight(principal.getName(), request);
        ApiResponse<CalculateWeightResponse> response = ApiResponse.<CalculateWeightResponse>builder()
                .code(1000)
                .message("Tính toán trọng lượng từ số tiền thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Hủy đơn hàng chưa thanh toán kèm lý do (NCL-03-CN-009)")
    @PostMapping("/{orderId}/cancel")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody CancelOrderRequest request) {
        OrderResponse result = orderService.cancelOrder(principal.getName(), orderId, request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Hủy đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Lấy danh mục lý do hủy đơn hàng chuẩn hóa (NCL-03-CN-009)")
    @GetMapping("/cancel-reasons")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<OrderCancelReasonDto>>> getCancelReasons() {
        List<OrderCancelReasonDto> result = orderService.getCancelReasons();
        ApiResponse<List<OrderCancelReasonDto>> response = ApiResponse.<List<OrderCancelReasonDto>>builder()
                .code(1000)
                .message("Lấy danh mục lý do hủy đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Thống kê đơn hủy theo ca và nhân viên (NCL-03-CN-009)")
    @GetMapping("/canceled-statistics")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<CanceledOrderStatisticsResponse>> getCanceledOrderStatistics(
            Principal principal,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        CanceledOrderStatisticsResponse result = orderService.getCanceledOrderStatistics(
                principal.getName(), shiftId, fromDate, toDate);
        ApiResponse<CanceledOrderStatisticsResponse> response = ApiResponse.<CanceledOrderStatisticsResponse>builder()
                .code(1000)
                .message("Lấy thống kê đơn hủy thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Lấy danh sách các đơn hàng đang treo trong ca (NCL-03-CN-010)")
    @GetMapping("/held")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<HeldOrderSummaryResponse>>> getHeldOrders(Principal principal) {
        List<HeldOrderSummaryResponse> result = orderService.getHeldOrders(principal.getName());
        return ResponseEntity.ok(ApiResponse.<List<HeldOrderSummaryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách đơn treo thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Đặt tên nhận diện, gắn bàn ăn và treo đơn (NCL-03-CN-010)")
    @PutMapping("/{orderId}/hold")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<OrderResponse>> holdOrder(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody HoldOrderRequest request) {
        OrderResponse result = orderService.holdOrder(principal.getName(), orderId, request);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Treo đơn hàng thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Cập nhật tên nhận diện đơn hàng (NCL-03-CN-010)")
    @PutMapping("/{orderId}/order-label")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderLabel(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody UpdateOrderLabelRequest request) {
        OrderResponse result = orderService.updateOrderLabel(principal.getName(), orderId, request);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Cập nhật tên nhận diện đơn hàng thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Chuyển đơn hàng sang bàn ăn khác (NCL-03-CN-010)")
    @PutMapping("/{orderId}/switch-table")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<OrderResponse>> switchDiningTable(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody SwitchDiningTableRequest request) {
        OrderResponse result = orderService.switchDiningTable(principal.getName(), orderId, request);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Chuyển bàn ăn thành công")
                .result(result)
                .build());
    }
}

