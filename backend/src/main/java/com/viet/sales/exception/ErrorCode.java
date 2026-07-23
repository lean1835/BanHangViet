package com.viet.sales.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    SUCCESS(1000, "Thành công", HttpStatus.OK),
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_FOUND(2001, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(2002, "Không có quyền truy cập", HttpStatus.UNAUTHORIZED),
    TAX_CODE_ALREADY_EXISTS(2003, "Mã số thuế đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    USERNAME_ALREADY_EXISTS(2004, "Tên đăng nhập đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(2005, "Vai trò không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    INVALID_INPUT(2006, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    WRONG_PASSWORD(2007, "Mật khẩu không chính xác", HttpStatus.BAD_REQUEST),
    USER_BLOCKED(2008, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    FORBIDDEN(2009, "Bạn không có quyền truy cập", HttpStatus.FORBIDDEN),
    HOUSEHOLD_NOT_FOUND(2010, "Hộ kinh doanh không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    PRODUCT_NOT_FOUND(3001, "Hàng hóa không tồn tại", HttpStatus.NOT_FOUND),
    PRODUCT_SKU_EXISTS(3002, "Mã hàng (SKU) đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    TAX_RATE_NOT_FOUND(3003, "Thuế suất không tồn tại hoặc không thuộc hộ kinh doanh", HttpStatus.NOT_FOUND),
    PRODUCT_GROUP_NOT_FOUND(3004, "Nhóm hàng không tồn tại hoặc không thuộc hộ kinh doanh", HttpStatus.NOT_FOUND),
    SHIFT_ALREADY_OPEN(3005, "Nhân viên đã có một ca bán hàng đang mở chưa đóng", HttpStatus.BAD_REQUEST),
    ACTIVE_SHIFT_NOT_FOUND(3006, "Không tìm thấy ca bán hàng hoạt động của nhân viên", HttpStatus.NOT_FOUND),
    ORDER_NOT_FOUND(3007, "Đơn bán hàng không tồn tại", HttpStatus.NOT_FOUND),
    ORDER_ALREADY_PAID(3008, "Đơn bán hàng đã thanh toán không thể chỉnh sửa hoặc chốt lại", HttpStatus.BAD_REQUEST),
    PRODUCT_GROUP_ALREADY_EXISTS(3010, "Tên nhóm hàng đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    DISCOUNT_EXCEEDS_TOTAL(3011, "Mức giảm giá không được lớn hơn tổng tiền đơn hàng", HttpStatus.BAD_REQUEST),
    DISCOUNT_LIMIT_EXCEEDED(3012, "Vượt quá hạn mức chiết khấu cho phép của nhân viên. Cần chủ hộ duyệt", HttpStatus.BAD_REQUEST),
    CUSTOMER_NOT_FOUND(3013, "Khách hàng không tồn tại", HttpStatus.NOT_FOUND),
    CUSTOMER_REQUIRED_FOR_DEBT(3014, "Đơn hàng ghi nợ bắt buộc phải chọn khách hàng thân thiết", HttpStatus.BAD_REQUEST),
    CREDIT_LIMIT_EXCEEDED(3015, "Số tiền ghi nợ vượt hạn mức cho phép của khách hàng", HttpStatus.BAD_REQUEST),
    ORDER_ITEM_NOT_FOUND(3016, "Dòng sản phẩm không tồn tại trong đơn hàng", HttpStatus.NOT_FOUND),
    PAYMENT_METHOD_NOT_SELECTED(3017, "Chưa chọn hình thức thanh toán", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_PAYMENT(3018, "Số tiền khách đưa không đủ để thanh toán", HttpStatus.BAD_REQUEST),
    RECEIPT_NUMBER_EXISTS(3019, "Số phiếu nhập kho đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    GOODS_RECEIPT_NOT_FOUND(3020, "Phiếu nhập kho không tồn tại", HttpStatus.NOT_FOUND),
    EMPTY_RECEIPT_DETAILS(3021, "Phiếu nhập kho phải chứa ít nhất một mặt hàng", HttpStatus.BAD_REQUEST),
    SHIFT_ALREADY_CLOSED(3022, "Ca bán hàng này đã được đóng trước đó", HttpStatus.BAD_REQUEST),
    SHIFT_HAS_PENDING_ORDER(3023, "Không thể đóng ca do còn đơn hàng chưa hoàn thành", HttpStatus.BAD_REQUEST),
    SHIFT_PERMISSION_DENIED(3024, "Bạn không có quyền đóng ca bán hàng của người khác", HttpStatus.FORBIDDEN),
    INVALID_ACTUAL_CASH(3025, "Cần ghi rõ lý do chênh lệch tiền mặt khi đối soát quỹ", HttpStatus.BAD_REQUEST),
    
    // Phát hành hóa đơn (Develop Branch)
    INVOICE_TEMPLATE_NOT_FOUND(4001, "Hộ kinh doanh chưa thiết lập cấu hình mẫu hóa đơn (ký hiệu, mẫu số)", HttpStatus.BAD_REQUEST),
    ORDER_NOT_COMPLETED(4002, "Chỉ được phát hành hóa đơn cho đơn bán hàng đã hoàn tất thanh toán", HttpStatus.BAD_REQUEST),
    INVOICE_ALREADY_EXISTS(4003, "Đơn bán hàng này đã được phát hành hóa đơn trước đó", HttpStatus.BAD_REQUEST),
    INVOICE_NOT_FOUND(4004, "Hóa đơn điện tử không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    INVOICE_CANNOT_BE_CANCELED(4005, "Không thể hủy hóa đơn ở trạng thái hiện tại (Chỉ cho phép hủy hóa đơn đã cấp mã)", HttpStatus.BAD_REQUEST),
    CANCEL_REASON_REQUIRED(4006, "Yêu cầu cung cấp lý do hủy hóa đơn", HttpStatus.BAD_REQUEST),
    INVOICE_NOT_SEND_ERROR(4007, "Hóa đơn không ở trạng thái lỗi để gửi lại", HttpStatus.BAD_REQUEST),
    INVOICE_NOT_EDITABLE(4008, "Chỉ được phép chỉnh sửa hóa đơn ở trạng thái nháp hoặc gửi lỗi", HttpStatus.BAD_REQUEST),
    
    // Điều chỉnh hóa đơn (Our feature - renumbered to avoid clash)
    INVOICE_NOT_ISSUED(4009, "Chỉ được điều chỉnh hóa đơn đã cấp mã (ISSUED)", HttpStatus.BAD_REQUEST),
    INVOICE_ADJUSTMENT_NO_CHANGE(4010, "Dữ liệu điều chỉnh phải khác biệt so với hóa đơn gốc", HttpStatus.BAD_REQUEST),
    INVOICE_ALREADY_ADJUSTED_OR_CANCELED(4011, "Hóa đơn đã bị điều chỉnh hoặc hủy trước đó", HttpStatus.BAD_REQUEST),
    FEATURE_NOT_ENABLED(4012, "Chức năng hóa đơn điện tử chưa được kích hoạt cho hộ kinh doanh", HttpStatus.BAD_REQUEST),
    CANNOT_OVERWRITE_ISSUED_INVOICE(4013, "Không thể ghi đè hóa đơn đã phát hành hoặc cấp mã", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
