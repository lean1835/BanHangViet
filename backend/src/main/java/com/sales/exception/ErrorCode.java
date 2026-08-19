package com.sales.exception;

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
    INVOICE_DELIVERY_NOT_ALLOWED(4013, "Chỉ được phép gửi thư điện tử cho hóa đơn đã phát hành (ISSUED)", HttpStatus.BAD_REQUEST),

    // NCL-09 Import & Export Excel & POS Print Settings
    EMPTY_IMPORT_FILE(2014, "Tệp import rỗng không chứa dòng dữ liệu nào", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED(2015, "Tệp import vượt quá dung lượng tối đa cho phép (10MB)", HttpStatus.BAD_REQUEST),
    NO_DATA_TO_EXPORT(2016, "Không có dữ liệu trong khoảng thời gian đã chọn", HttpStatus.BAD_REQUEST),

    // Cấu hình Nền tảng & Thuế suất (NCL-09 Branch 1)
    INVALID_TAX_CODE(2030, "Mã số thuế không đúng định dạng 10 hoặc 13 chữ số", HttpStatus.BAD_REQUEST),
    INVALID_INVOICE_SYMBOL(2031, "Ký hiệu hóa đơn không đúng quy định TT78", HttpStatus.BAD_REQUEST),
    INVALID_TAX_RATE_PERCENTAGE(2032, "Tỷ lệ phần trăm thuế không hợp lệ (từ 0% đến 100%)", HttpStatus.BAD_REQUEST),
    TAX_RATE_ALREADY_EXISTS(2033, "Tên mức thuế suất đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    INACTIVE_TAX_RATE(2034, "Mức thuế suất đã bị ngừng hiệu lực", HttpStatus.BAD_REQUEST),
    TAX_RATE_IN_USE(2035, "Mức thuế suất đang được sử dụng bởi các sản phẩm trong hệ thống", HttpStatus.BAD_REQUEST),
    CANNOT_OVERWRITE_ISSUED_INVOICE(4014, "Không thể ghi đè hóa đơn đã phát hành hoặc cấp mã", HttpStatus.BAD_REQUEST),

    // Quản lý khách hàng thân thiết và công nợ (NCL-10)
    CUSTOMER_PHONE_EXISTS(3026, "Số điện thoại khách hàng đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    DEBT_NOT_FOUND(3027, "Khoản công nợ không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_DEBT_PAYMENT_AMOUNT(3028, "Số tiền thu nợ không hợp lệ", HttpStatus.BAD_REQUEST),
    CUSTOMER_HAS_OUTSTANDING_DEBT(3029, "Không thể xóa khách hàng đang còn dư nợ công nợ", HttpStatus.BAD_REQUEST),
    EMAIL_SEND_FAILED(3030, "Gửi thư điện tử thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Quản lý Trả hàng, hoàn tiền và điều chỉnh giảm (NCL-11)
    RETURN_TICKET_NOT_FOUND(4020, "Không tìm thấy phiếu trả hàng", HttpStatus.NOT_FOUND),
    INVOICE_NOT_ELIGIBLE_FOR_RETURN(4021, "Hóa đơn gốc không ở trạng thái được phép trả hàng (phải là ISSUED và chưa bị hủy)", HttpStatus.BAD_REQUEST),
    EXCEEDED_RETURNABLE_QUANTITY(4022, "Số lượng trả vượt quá số lượng còn lại có thể trả của hóa đơn gốc", HttpStatus.BAD_REQUEST),
    RETURN_PERIOD_EXPIRED(4023, "Hóa đơn gốc đã quá thời hạn trả hàng theo quy định của cửa hàng", HttpStatus.BAD_REQUEST),
    RETURN_TICKET_ALREADY_PROCESSED(4024, "Phiếu trả hàng đã được xử lý duyệt hoặc từ chối trước đó", HttpStatus.BAD_REQUEST),
    RETURN_TICKET_NOT_APPROVED(4025, "Phiếu trả hàng chưa được duyệt, không thể lập hóa đơn điều chỉnh giảm", HttpStatus.BAD_REQUEST),
    ADJUSTMENT_INVOICE_ALREADY_EXISTS(4026, "Hóa đơn điều chỉnh giảm đã được lập cho phiếu trả hàng này", HttpStatus.BAD_REQUEST),
    EMPTY_RETURN_TICKET_ITEMS(4027, "Phiếu trả hàng phải chọn ít nhất một mặt hàng để trả", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED_RETURN_ACTION(4028, "Chỉ có chủ hộ mới có quyền duyệt hoặc từ chối phiếu trả hàng", HttpStatus.FORBIDDEN),

    // NCL-13 Quản lý nhà cung cấp & Công nợ phải trả (NCL-13-CN-003)
    SUPPLIER_NOT_FOUND(3031, "Nhà cung cấp không tồn tại", HttpStatus.NOT_FOUND),
    SUPPLIER_PHONE_EXISTS(3032, "Số điện thoại nhà cung cấp đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    SUPPLIER_HAS_DEPENDENCIES(3033, "Không thể xóa nhà cung cấp đã phát sinh phiếu nhập kho", HttpStatus.BAD_REQUEST),
    SELLING_BELOW_COST_WARNING(3034, "Đơn giá nhập cao hơn giá bán niêm yết. Cần xác nhận từ chủ hộ", HttpStatus.BAD_REQUEST),
    SUPPLIER_DEBT_NOT_FOUND(3035, "Khoản công nợ nhà cung cấp không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_SUPPLIER_PAYMENT_AMOUNT(3036, "Số tiền thanh toán nợ nhà cung cấp không hợp lệ", HttpStatus.BAD_REQUEST),
    SUPPLIER_HAS_OUTSTANDING_DEBT(3037, "Không thể xóa nhà cung cấp đang còn công nợ chưa thanh toán", HttpStatus.BAD_REQUEST),

    // NCL-13 Kiểm kê kho và kiểm tra chênh lệch tồn (NCL-13-CN-004)
    INVENTORY_AUDIT_NOT_FOUND(3040, "Phiếu kiểm kê kho không tồn tại", HttpStatus.NOT_FOUND),
    EMPTY_AUDIT_DETAILS(3041, "Phiếu kiểm kê kho phải chứa ít nhất một mặt hàng", HttpStatus.BAD_REQUEST),
    DISCREPANCY_REASON_REQUIRED(3042, "Cần ghi rõ lý do khi số lượng đếm thực tế có chênh lệch so với tồn hệ thống", HttpStatus.BAD_REQUEST),
    DUPLICATE_PRODUCT_IN_AUDIT(3043, "Không được chứa sản phẩm trùng lặp trong cùng một phiếu kiểm kê", HttpStatus.BAD_REQUEST),
    ONLY_STORE_OWNER_CAN_AUDIT(3044, "Chỉ chủ hộ kinh doanh mới có quyền thực hiện kiểm kê và điều chỉnh tồn kho", HttpStatus.FORBIDDEN),

    // NCL-12 Sổ sách & Hỗ trợ kê khai thuế theo kỳ
    NO_VALID_INVOICES_IN_PERIOD(5001, "Kỳ kê khai chưa có hóa đơn hợp lệ được cấp mã", HttpStatus.BAD_REQUEST),
    TAX_PERIOD_NOT_FOUND(5002, "Kỳ kê khai thuế không tồn tại", HttpStatus.NOT_FOUND),
    TAX_PERIOD_ALREADY_EXISTS(5003, "Kỳ kê khai thuế này đã được tạo trước đó", HttpStatus.BAD_REQUEST),
    TAX_PERIOD_ALREADY_LOCKED(5004, "Kỳ kê khai thuế đã bị khóa, không thể thay đổi", HttpStatus.BAD_REQUEST),
    PRODUCT_TAX_RATE_INACTIVE(5005, "Có mặt hàng trong kỳ đang gán mức thuế đã ngừng hiệu lực", HttpStatus.BAD_REQUEST),
    HOUSEHOLD_TAX_INFO_INCOMPLETE(5006, "Thông tin hộ kinh doanh chưa đầy đủ (thiếu mã số thuế hoặc người đại diện) để xuất tờ khai thuế", HttpStatus.BAD_REQUEST),
    HOUSEHOLD_TAX_CODE_MISSING(5007, "Thông tin hộ kinh doanh chưa đầy đủ: Thiếu mã số thuế", HttpStatus.BAD_REQUEST),
    HOUSEHOLD_REPRESENTATIVE_MISSING(5008, "Thông tin hộ kinh doanh chưa đầy đủ: Thiếu người đại diện hợp pháp", HttpStatus.BAD_REQUEST),
    TAX_PERIOD_NOT_LOCKED(5009, "Kỳ kê khai thuế chưa bị khóa", HttpStatus.BAD_REQUEST),
    TAX_PERIOD_UNLOCK_REASON_REQUIRED(5010, "Lý do mở lại kỳ kê khai không được để trống", HttpStatus.BAD_REQUEST),

    // NCL-14 Nhật ký kiểm toán không sửa xóa được
    AUDIT_LOG_IMMUTABLE(6001, "Nhật ký kiểm toán là dữ liệu bất biến, tuyệt đối không được sửa hoặc xóa", HttpStatus.FORBIDDEN),
    AUDIT_LOG_TAMPERED(6002, "Phát hiện chuỗi kiểm tra Hash Chain bị đứt gãy hoặc bị can thiệp trái phép", HttpStatus.INTERNAL_SERVER_ERROR),
    AUDIT_LOG_NOT_FOUND(6003, "Không tìm thấy bản ghi nhật ký kiểm toán", HttpStatus.NOT_FOUND);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
