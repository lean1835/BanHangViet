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
    USER_BLOCKED(2008, "Tài khoản đã bị khóa. Vui lòng liên hệ chủ hộ kinh doanh để được hỗ trợ", HttpStatus.FORBIDDEN),
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
    INVOICE_RANGE_EXHAUSTED(4030, "Dải số hóa đơn đã dùng hết. Vui lòng khai báo dải số mới trước khi phát hành hóa đơn.", HttpStatus.BAD_REQUEST),
    INVOICE_RANGE_INVALID(4031, "Dải số hóa đơn khai báo không hợp lệ (Số kết thúc phải lớn hơn số bắt đầu).", HttpStatus.BAD_REQUEST),
    INVOICE_RANGE_OVERLAP(4032, "Dải số hóa đơn khai báo bị trùng lặp với dải số hiện có.", HttpStatus.BAD_REQUEST),
    INVOICE_RANGE_NOT_FOUND(4033, "Không tìm thấy dải số hóa đơn cho hộ kinh doanh.", HttpStatus.NOT_FOUND),

    // NCL-09 Import & Export Excel & POS Print Settings
    EMPTY_IMPORT_FILE(2014, "Tệp import rỗng không chứa dòng dữ liệu nào", HttpStatus.BAD_REQUEST),
    FILE_SIZE_EXCEEDED(2015, "Tệp import vượt quá dung lượng tối đa cho phép (10MB)", HttpStatus.BAD_REQUEST),
    NO_DATA_TO_EXPORT(2016, "Không có dữ liệu trong khoảng thời gian đã chọn", HttpStatus.BAD_REQUEST),
    INVALID_DEADLINE_VALUE(2071, "Mốc thời hạn cấu hình không nằm trong khoảng cho phép", HttpStatus.BAD_REQUEST),
    INVALID_PHONE_FORMAT(2072, "Số điện thoại không đúng định dạng", HttpStatus.BAD_REQUEST),
    IMPORT_DATA_CONFLICT(2073, "Dữ liệu tệp bị xung đột hoặc trùng lặp", HttpStatus.CONFLICT),

    // Cấu hình Nền tảng & Thuế suất (NCL-09 Branch 1)
    INVALID_TAX_CODE(2030, "Mã số thuế không đúng định dạng 10 hoặc 13 chữ số", HttpStatus.BAD_REQUEST),
    INVALID_INVOICE_SYMBOL(2031, "Ký hiệu hóa đơn không đúng quy định TT78", HttpStatus.BAD_REQUEST),
    INVALID_TAX_RATE_PERCENTAGE(2032, "Tỷ lệ phần trăm thuế không hợp lệ (từ 0% đến 100%)", HttpStatus.BAD_REQUEST),
    TAX_RATE_ALREADY_EXISTS(2033, "Tên mức thuế suất đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    INACTIVE_TAX_RATE(2034, "Mức thuế suất đã bị ngừng hiệu lực", HttpStatus.BAD_REQUEST),
    TAX_RATE_IN_USE(2035, "Mức thuế suất đang được sử dụng bởi các sản phẩm trong hệ thống", HttpStatus.BAD_REQUEST),
    CANNOT_OVERWRITE_ISSUED_INVOICE(4014, "Không thể ghi đè hóa đơn đã phát hành hoặc cấp mã", HttpStatus.BAD_REQUEST),
    INVOICE_ALREADY_NOTICE_ACCEPTED(4015, "Hóa đơn đã thuộc một thông báo sai sót đã được Cơ quan thuế tiếp nhận", HttpStatus.BAD_REQUEST),
    INVOICE_NOT_ELIGIBLE_FOR_ERROR_NOTICE(4016, "Chỉ được lập thông báo sai sót cho hóa đơn ở trạng thái Hủy hoặc Điều chỉnh", HttpStatus.BAD_REQUEST),
    ERROR_NOTICE_NOT_FOUND(4017, "Thông báo sai sót không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    ERROR_NOTICE_CANNOT_SEND(4018, "Thông báo sai sót không ở trạng thái nháp hoặc bị từ chối để gửi Cơ quan thuế", HttpStatus.BAD_REQUEST),
    EMPTY_NOTICE_ITEMS(4019, "Thông báo sai sót phải chứa ít nhất một hóa đơn", HttpStatus.BAD_REQUEST),
    ERROR_NOTICE_CANNOT_REOPEN(4029, "Chỉ thông báo ở trạng thái bị từ chối mới có thể đưa về bản nháp", HttpStatus.BAD_REQUEST),
    ERROR_NOTICE_CANNOT_UPDATE(4034, "Chỉ thông báo ở trạng thái nháp hoặc bị từ chối mới được phép chỉnh sửa", HttpStatus.BAD_REQUEST),
    ERROR_NOTICE_CANNOT_REJECT(4035, "Chỉ thông báo ở trạng thái chờ phản hồi hoặc bản nháp mới có thể từ chối, không thể từ chối thông báo đã được tiếp nhận", HttpStatus.BAD_REQUEST),
    DUPLICATE_INVOICE_IN_NOTICE(4036, "Không được chứa hóa đơn trùng lặp trong cùng một thông báo sai sót", HttpStatus.BAD_REQUEST),

    // Quản lý khách hàng thân thiết và công nợ (NCL-10)
    CUSTOMER_PHONE_EXISTS(3026, "Số điện thoại khách hàng đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    DEBT_NOT_FOUND(3027, "Khoản công nợ không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_DEBT_PAYMENT_AMOUNT(3028, "Số tiền thu nợ không hợp lệ", HttpStatus.BAD_REQUEST),
    CUSTOMER_HAS_OUTSTANDING_DEBT(3029, "Không thể xóa khách hàng đang còn dư nợ công nợ", HttpStatus.BAD_REQUEST),
    EMAIL_SEND_FAILED(3030, "Gửi thư điện tử thất bại", HttpStatus.INTERNAL_SERVER_ERROR),

    // Quản lý tích điểm và đổi điểm cho khách thân thiết (NCL-10-CN-008)
    LOYALTY_PROGRAM_NOT_ENABLED(3080, "Chương trình tích điểm chưa được kích hoạt cho hộ kinh doanh", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_LOYALTY_POINTS(3081, "Số điểm tích lũy của khách hàng không đủ để thực hiện quy đổi", HttpStatus.BAD_REQUEST),
    MIN_POINTS_TO_REDEEM_NOT_REACHED(3082, "Khách hàng chưa đạt số điểm tối thiểu để quy đổi ưu đãi", HttpStatus.BAD_REQUEST),
    POINTS_TO_REDEEM_EXCEEDS_ORDER_TOTAL(3083, "Số tiền quy đổi từ điểm vượt quá số tiền thanh toán cho phép của đơn hàng", HttpStatus.BAD_REQUEST),
    CUSTOMER_REQUIRED_FOR_LOYALTY(3084, "Đơn hàng phải gắn với khách hàng có hồ sơ để áp dụng tích/đổi điểm", HttpStatus.BAD_REQUEST),
    INVALID_LOYALTY_CONFIG(3085, "Thông số cấu hình chương trình tích điểm không hợp lệ", HttpStatus.BAD_REQUEST),
    POINTS_MUST_BE_POSITIVE(3086, "Số điểm yêu cầu quy đổi phải là số nguyên dương lớn hơn 0", HttpStatus.BAD_REQUEST),
    ORDER_NOT_IN_CREATING_STATUS(3087, "Chỉ có thể đổi điểm trên đơn hàng đang ở trạng thái tạo đơn", HttpStatus.BAD_REQUEST),

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

    // NCL-13 Trả hàng lại nhà cung cấp (NCL-13-CN-006)
    SUPPLIER_RETURN_NOT_FOUND(3038, "Phiếu trả hàng cho nhà cung cấp không tồn tại", HttpStatus.NOT_FOUND),
    EXCEEDED_SUPPLIER_RETURNABLE_QUANTITY(3039, "Số lượng trả vượt quá số lượng đã nhập trừ số lượng đã trả trước đó", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_STOCK_FOR_RETURN(3045, "Số lượng trả vượt quá số lượng tồn kho hiện tại của mặt hàng", HttpStatus.BAD_REQUEST),
    EMPTY_SUPPLIER_RETURN_ITEMS(3046, "Phiếu trả hàng nhà cung cấp phải chứa ít nhất một mặt hàng", HttpStatus.BAD_REQUEST),
    RECEIPT_DETAIL_NOT_FOUND_IN_RECEIPT(3047, "Mặt hàng yêu cầu trả không thuộc phiếu nhập kho gốc đã chọn", HttpStatus.BAD_REQUEST),
    SUPPLIER_RETURN_NUMBER_EXISTS(3048, "Số hiệu phiếu trả hàng nhà cung cấp đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),
    ONLY_STORE_OWNER_CAN_RETURN_SUPPLIER(3049, "Chỉ chủ hộ kinh doanh mới có quyền lập phiếu trả hàng cho nhà cung cấp", HttpStatus.FORBIDDEN),

    // NCL-15 Chiết khấu & Chương trình khuyến mại (NCL-15-CN-001 & NCL-15-CN-002)
    PROMOTION_NOT_FOUND(3050, "Chương trình khuyến mại không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_PROMOTION_DATE(3051, "Thời gian kết thúc phải lớn hơn thời gian bắt đầu", HttpStatus.BAD_REQUEST),
    INVALID_PROMOTION_DISCOUNT_VALUE(3052, "Mức giảm giá không hợp lệ", HttpStatus.BAD_REQUEST),
    PROMOTION_TARGET_REQUIRED(3053, "Cần chọn danh sách sản phẩm hoặc nhóm sản phẩm áp dụng", HttpStatus.BAD_REQUEST),
    ONLY_STORE_OWNER_CAN_MANAGE_PROMOTION(3054, "Chỉ chủ hộ kinh doanh mới có quyền tạo và quản lý chương trình khuyến mại", HttpStatus.FORBIDDEN),
    PROMOTION_NAME_EXISTS(3055, "Tên chương trình khuyến mại đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    PROMOTION_REMOVE_REQUIRES_OWNER(3056, "Nhân viên không có quyền bỏ khuyến mại tự động, cần có sự phê duyệt của chủ hộ kinh doanh", HttpStatus.FORBIDDEN),

    // NCL-16 Mã vạch (NCL-16-CN-002)
    BARCODE_ALREADY_EXISTS(3057, "Mã vạch đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    FORBIDDEN_BARCODE_MANAGEMENT(3058, "Chỉ chủ hộ kinh doanh mới có quyền thao tác mã vạch", HttpStatus.FORBIDDEN),
    BARCODE_GENERATION_FAILED(3059, "Không thể sinh mã vạch nội bộ", HttpStatus.INTERNAL_SERVER_ERROR),

    // NCL-02-CN-006 Xem thẻ kho biến động tồn
    INVALID_DATE_RANGE(3060, "Khoảng thời gian không hợp lệ (Từ ngày phải trước hoặc bằng Đến ngày)", HttpStatus.BAD_REQUEST),

    // NCL-02-CN-007 Quản lý đơn vị tính và quy đổi đơn vị mua bán
    UNIT_CONVERSION_NOT_FOUND(3070, "Đơn vị tính quy đổi không tồn tại", HttpStatus.NOT_FOUND),
    CANNOT_MODIFY_CONVERSION_WITH_STOCK_MOVEMENT(3071, "Không thể sửa tỷ lệ quy đổi khi mặt hàng đã phát sinh biến động tồn kho (TC-03)", HttpStatus.BAD_REQUEST),
    DUPLICATE_UNIT_CONVERSION_NAME(3072, "Tên đơn vị quy đổi đã tồn tại hoặc trùng với đơn vị tính cơ bản", HttpStatus.BAD_REQUEST),
    INVALID_CONVERSION_FACTOR(3073, "Tỷ lệ quy đổi phải lớn hơn 0 và khác 1", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_CONVERSION_IN_USE(3074, "Không thể xóa đơn vị quy đổi đã phát sinh giao dịch nhập xuất", HttpStatus.BAD_REQUEST),

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
    INVALID_WARNING_THRESHOLD_PERCENTAGE(5011, "Tỷ lệ cảnh báo ngưỡng doanh thu không hợp lệ (phải từ 50.0% đến 99.0%)", HttpStatus.BAD_REQUEST),
    YEAR_INVALID(5012, "Năm tài chính khảo sát không hợp lệ", HttpStatus.BAD_REQUEST),
    NOTIFICATION_NOT_FOUND(5013, "Không tìm thấy thông báo trong hệ thống", HttpStatus.NOT_FOUND),
    NO_GOODS_RECEIPTS_IN_PERIOD(5014, "Kỳ kê khai chưa có phiếu nhập hàng nào được lưu", HttpStatus.BAD_REQUEST),
    PURCHASE_REGISTER_NOT_FOUND(5015, "Bảng kê hàng hóa mua vào của kỳ kê khai chưa được lập", HttpStatus.NOT_FOUND),
    PURCHASE_REGISTER_ALREADY_LOCKED(5016, "Bảng kê hàng hóa mua vào thuộc kỳ đã bị khóa, không thể thay đổi số liệu (QTN-21)", HttpStatus.BAD_REQUEST),
    INVALID_REMINDER_DAYS(5017, "Số ngày nhắc trước hạn nộp tờ khai phải từ 1 đến 30 ngày", HttpStatus.BAD_REQUEST),
    INVALID_TAX_PERIOD_TYPE(5018, "Kỳ kê khai thuế áp dụng phải là MONTHLY hoặc QUARTERLY", HttpStatus.BAD_REQUEST),
    TAX_REMINDER_DISABLED(5019, "Tính năng nhắc lịch nộp tờ khai của hộ kinh doanh hiện đang bị tắt", HttpStatus.BAD_REQUEST),

    // NCL-14-CN-002 Sao lưu dữ liệu tự động theo ngày
    BACKUP_CONFIG_NOT_FOUND(5020, "Cấu hình sao lưu dữ liệu tự động không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_RETENTION_COUNT(5021, "Số lượng bản sao lưu giữ lại phải từ 1 đến 100", HttpStatus.BAD_REQUEST),
    INVALID_SCHEDULED_TIME(5022, "Thời gian chạy sao lưu không đúng định dạng HH:mm (00:00 - 23:59)", HttpStatus.BAD_REQUEST),
    BACKUP_FILE_NOT_FOUND(5023, "Tệp sao lưu không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    BACKUP_EXECUTION_FAILED(5024, "Lỗi thực thi sao lưu dữ liệu tự động", HttpStatus.INTERNAL_SERVER_ERROR),
    ONLY_STORE_OWNER_CAN_BACKUP(5025, "Chỉ chủ hộ kinh doanh mới có quyền cấu hình và thực thi sao lưu dữ liệu", HttpStatus.FORBIDDEN),

    // NCL-14-CN-003 Phục hồi dữ liệu từ bản sao lưu
    RESTORE_NOT_ALLOWED(5030, "Chỉ chủ hộ kinh doanh mới có quyền thực hiện phục hồi dữ liệu", HttpStatus.FORBIDDEN),
    BACKUP_NOT_ELIGIBLE_FOR_RESTORE(5031, "Bản sao lưu không hợp lệ hoặc đã bị dọn dẹp (PURGED), không thể phục hồi", HttpStatus.BAD_REQUEST),
    BACKUP_CORRUPTED_OR_INVALID(5032, "Bản sao lưu bị lỗi cấu trúc hoặc không đọc được dữ liệu", HttpStatus.BAD_REQUEST),
    RESTORE_CONFIRMATION_REQUIRED(5033, "Yêu cầu xác nhận đồng ý ghi đè/khôi phục dữ liệu trước khi thực hiện", HttpStatus.BAD_REQUEST),
    RESTORE_EXECUTION_FAILED(5034, "Quá trình phục hồi dữ liệu gặp sự cố kỹ thuật", HttpStatus.INTERNAL_SERVER_ERROR),

    // NCL-14 Nhật ký kiểm toán không sửa xóa được
    AUDIT_LOG_IMMUTABLE(6001, "Nhật ký kiểm toán là dữ liệu bất biến, tuyệt đối không được sửa hoặc xóa", HttpStatus.FORBIDDEN),
    AUDIT_LOG_TAMPERED(6002, "Phát hiện chuỗi kiểm tra Hash Chain bị đứt gãy hoặc bị can thiệp trái phép", HttpStatus.INTERNAL_SERVER_ERROR),
    AUDIT_LOG_NOT_FOUND(6003, "Không tìm thấy bản ghi nhật ký kiểm toán", HttpStatus.NOT_FOUND),


    // NCL-14-CN-004 Cảnh báo thao tác bất thường
    ANOMALY_ALERT_NOT_FOUND(6010, "Cảnh báo thao tác bất thường không tồn tại", HttpStatus.NOT_FOUND),
    ANOMALY_RULE_NOT_FOUND(6011, "Cấu hình quy tắc cảnh báo không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_ANOMALY_STATUS(6012, "Trạng thái xử lý cảnh báo không hợp lệ (chỉ chấp nhận REVIEWED hoặc DISMISSED)", HttpStatus.BAD_REQUEST),
    ANOMALY_ACCESS_DENIED(6013, "Nhân viên không có quyền truy cập trung tâm cảnh báo thao tác bất thường", HttpStatus.FORBIDDEN),

    // NCL-17 Nhiều điểm bán trong cùng một hộ kinh doanh (NCL-17-CN-001)
    POS_NOT_FOUND(7001, "Điểm bán không tồn tại trên hệ thống", HttpStatus.NOT_FOUND),
    POS_NAME_ALREADY_EXISTS(7002, "Tên điểm bán đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    POS_CODE_ALREADY_EXISTS(7003, "Mã điểm bán đã tồn tại trong hộ kinh doanh", HttpStatus.BAD_REQUEST),
    POS_INVOICE_SYMBOL_EXISTS(7004, "Ký hiệu hóa đơn của điểm bán mới trùng với điểm bán đã có", HttpStatus.BAD_REQUEST),
    CANNOT_DELETE_DEFAULT_POS(7005, "Không thể xóa điểm bán đang được thiết lập làm mặc định", HttpStatus.BAD_REQUEST),
    CANNOT_DEACTIVATE_DEFAULT_POS(7006, "Không thể ngưng hoạt động điểm bán mặc định. Vui lòng chuyển mặc định sang điểm bán khác trước", HttpStatus.BAD_REQUEST),
    CANNOT_SET_INACTIVE_POS_AS_DEFAULT(7007, "Không thể thiết lập điểm bán đang ngưng hoạt động làm điểm mặc định", HttpStatus.BAD_REQUEST),
    
    // NCL-17-CN-002 Gán nhân viên và tồn kho theo từng điểm bán
    POS_EMPLOYEE_ACCESS_DENIED(7011, "Nhân viên chỉ được phép thao tác tại điểm bán được gán", HttpStatus.FORBIDDEN),
    POS_PRODUCT_NOT_INITIALIZED(7012, "Mặt hàng chưa được khai báo tồn kho tại điểm bán này. Vui lòng chuyển hàng hoặc khởi tạo tồn kho", HttpStatus.BAD_REQUEST),
    POS_INSUFFICIENT_STOCK(7013, "Số lượng tồn kho tại điểm bán không đủ để bán", HttpStatus.BAD_REQUEST),
    POS_EMPLOYEE_NOT_ASSIGNED(7014, "Nhân viên chưa được gán vào điểm bán nào", HttpStatus.FORBIDDEN),
    CANNOT_ASSIGN_OWNER_TO_POS(7015, "Chủ hộ có quyền quản trị toàn bộ điểm bán, không thể gán điểm bán cố định", HttpStatus.BAD_REQUEST),
    INVALID_POS_INVENTORY_QTY(7016, "Số lượng tồn kho khai báo không được nhỏ hơn 0", HttpStatus.BAD_REQUEST),
    
    // NCL-17-CN-003 Chuyển hàng giữa các điểm bán
    TRANSFER_NOT_FOUND(7020, "Phiếu chuyển hàng không tồn tại", HttpStatus.NOT_FOUND),
    TRANSFER_SAME_POS(7021, "Điểm bán gửi và điểm bán nhận không được trùng nhau", HttpStatus.BAD_REQUEST),
    TRANSFER_INVALID_STATUS(7022, "Trạng thái phiếu chuyển không hợp lệ để thực hiện thao tác", HttpStatus.BAD_REQUEST),
    TRANSFER_ITEMS_EMPTY(7023, "Phiếu chuyển hàng phải có ít nhất một mặt hàng", HttpStatus.BAD_REQUEST),
    TRANSFER_QUANTITY_INVALID(7024, "Số lượng chuyển phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    TRANSFER_EXCEED_STOCK(7025, "Số lượng chuyển vượt quá tồn kho hiện có tại điểm gửi", HttpStatus.BAD_REQUEST),
    TRANSFER_RECEIVER_PERMISSION_DENIED(7026, "Chỉ nhân viên thuộc điểm nhận, kế toán hoặc chủ hộ mới có quyền xác nhận nhận hàng", HttpStatus.FORBIDDEN),
    TRANSFER_CANCEL_REASON_REQUIRED(7027, "Cần nhập lý do khi hủy phiếu chuyển hàng", HttpStatus.BAD_REQUEST),
    TRANSFER_EXCEED_WAREHOUSE_STOCK(7028, "Số lượng chuyển vượt quá tồn kho khả dụng tại Kho gốc", HttpStatus.BAD_REQUEST),
    POS_INVENTORY_EXCEED_PRODUCT_STOCK(7029, "Số lượng tồn kho phân bổ vượt quá tồn kho khả dụng trong danh mục hàng hóa", HttpStatus.BAD_REQUEST),
    TRANSFER_SAME_SOURCE_DEST(7030, "Điểm gửi và điểm nhận không được trùng nhau", HttpStatus.BAD_REQUEST),
    TRANSFER_SOURCE_AND_DEST_EMPTY(7031, "Cần chọn điểm gửi hoặc điểm nhận hợp lệ", HttpStatus.BAD_REQUEST),

    // NCL-01-CN-005 Đặt lại mật khẩu khi quên
    OTP_EXPIRED(2036, "Mã xác thực đã hết hiệu lực. Vui lòng yêu cầu gửi lại mã mới", HttpStatus.BAD_REQUEST),
    INVALID_OTP(2037, "Mã xác thực không chính xác", HttpStatus.BAD_REQUEST),
    OTP_MAX_ATTEMPTS_EXCEEDED(2038, "Bạn đã nhập sai mã xác thực quá 5 lần. Vui lòng yêu cầu mã mới", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRMATION_MISMATCH(2039, "Mật khẩu xác nhận không khớp với mật khẩu mới", HttpStatus.BAD_REQUEST),
    PHONE_NUMBER_NOT_FOUND(2040, "Số điện thoại chưa được đăng ký trong hệ thống", HttpStatus.NOT_FOUND),
    OTP_COOLDOWN_ACTIVE(2041, "Vui lòng đợi 60 giây trước khi yêu cầu mã xác thực mới", HttpStatus.BAD_REQUEST),

    // NCL-01-CN-006 Đổi mật khẩu và cập nhật hồ sơ cá nhân
    NEW_PASSWORD_SAME_AS_CURRENT(2042, "Mật khẩu mới không được trùng với mật khẩu hiện tại", HttpStatus.BAD_REQUEST),
    PHONE_NUMBER_ALREADY_EXISTS(2043, "Số điện thoại này đã được sử dụng bởi tài khoản khác", HttpStatus.BAD_REQUEST),
    PHONE_NUMBER_UNCHANGED(2044, "Số điện thoại mới trùng với số điện thoại hiện tại", HttpStatus.BAD_REQUEST),

    // NCL-01-CN-007 Quản lý phiên đăng nhập và đăng xuất từ xa
    SESSION_NOT_FOUND(2045, "Phiên đăng nhập không tồn tại hoặc đã kết thúc", HttpStatus.NOT_FOUND),
    SESSION_ALREADY_REVOKED(2046, "Phiên đăng nhập này đã bị đăng xuất trước đó", HttpStatus.BAD_REQUEST),
    CANNOT_REVOKE_OTHER_USER_SESSION(2047, "Bạn không có quyền đăng xuất phiên của người dùng khác", HttpStatus.FORBIDDEN),
    SESSION_TIMEOUT_INVALID(2048, "Thời gian tự hết hạn phiên không hợp lệ (tối thiểu 5 phút, tối đa 1440 phút)", HttpStatus.BAD_REQUEST),
    SESSION_REVOKED(2049, "Phiên đăng nhập của bạn đã bị đăng xuất từ xa hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    EMAIL_NOT_FOUND(2050, "Địa chỉ email chưa được đăng ký trong hệ thống", HttpStatus.NOT_FOUND),

    // NCL-02-CN-008 Bán hàng theo cân với số lượng thập phân
    WEIGHT_STEP_INVALID(3080, "Số lượng nhập không hợp lệ (nhỏ hơn bước nhảy tối thiểu hoặc không đúng bội số bước nhảy)", HttpStatus.BAD_REQUEST),
    DECIMAL_PLACES_EXCEEDED(3081, "Số chữ số thập phân của số lượng vượt quá số chữ số cho phép của mặt hàng", HttpStatus.BAD_REQUEST),
    NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED(3082, "Mặt hàng bán theo đơn vị nguyên không được nhập số lượng lẻ thập phân", HttpStatus.BAD_REQUEST),
    INVALID_WEIGHT_CONFIG(3083, "Cấu hình hàng bán theo cân không hợp lệ (bước nhảy phải > 0, số chữ số thập phân từ 1-3)", HttpStatus.BAD_REQUEST),
    ORDER_TOTAL_MISMATCH(3084, "Tổng tiền hóa đơn không khớp với tổng thành tiền các dòng hàng theo quy định QTN-07", HttpStatus.BAD_REQUEST),
    BUY_AMOUNT_TOO_SMALL(3085, "Số tiền mua quá nhỏ, không đủ quy đổi ra bước nhảy tối thiểu của mặt hàng", HttpStatus.BAD_REQUEST),

    // NCL-02-CN-009 Cập nhật giá bán hàng loạt theo nhóm hàng
    PRICE_ADJUSTMENT_BATCH_NOT_FOUND(3090, "Đợt điều chỉnh giá không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    PRICE_ADJUSTMENT_ALREADY_REVERTED(3091, "Đợt điều chỉnh giá này đã được hoàn tác trước đó", HttpStatus.BAD_REQUEST),
    PRICE_ADJUSTMENT_REVERT_EXPIRED(3092, "Đã quá thời hạn 24 giờ kể từ khi áp dụng, không thể hoàn tác đợt điều chỉnh giá này", HttpStatus.BAD_REQUEST),
    PRICE_ADJUSTMENT_NO_PRODUCTS_SELECTED(3093, "Không tìm thấy mặt hàng nào phù hợp với điều kiện điều chỉnh giá đã chọn", HttpStatus.BAD_REQUEST),
    PRICE_ADJUSTMENT_INVALID_VALUE(3094, "Giá trị điều chỉnh không hợp lệ (tỷ lệ phần trăm không được nhỏ hơn -100% hoặc giá mới không được âm)", HttpStatus.BAD_REQUEST),
    PRICE_ADJUSTMENT_REVERT_REASON_REQUIRED(3095, "Vui lòng nhập lý do hoàn tác đợt điều chỉnh giá", HttpStatus.BAD_REQUEST),

    // NCL-02-CN-010 Quản lý giá bán lẻ và giá bán sỉ theo mức số lượng
    PRICE_TIER_NOT_FOUND(3100, "Bậc giá không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    PRICE_TIER_BELOW_COST_CONFIRMATION_REQUIRED(3101, "Giá bậc thấp hơn giá vốn bình quân (nguy cơ bán lỗ). Vui lòng xác nhận để tiếp tục lưu", HttpStatus.BAD_REQUEST),
    PRICE_TIER_OVERLAPPING_QUANTITY(3102, "Khoảng số lượng của bậc giá bị trùng lặp với bậc giá khác đang hoạt động", HttpStatus.BAD_REQUEST),
    PRICE_TIER_INVALID_QUANTITY_RANGE(3103, "Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu", HttpStatus.BAD_REQUEST),
    PRICE_TIER_MIN_QUANTITY_INVALID(3104, "Số lượng tối thiểu của bậc giá phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    PRICE_TIER_PRICE_NEGATIVE(3105, "Đơn giá bậc không được nhỏ hơn 0", HttpStatus.BAD_REQUEST),
    PRICE_TIER_UNIT_CONVERSION_MISMATCH(3106, "Đơn vị quy đổi không thuộc về mặt hàng này", HttpStatus.BAD_REQUEST),

    // NCL-03-CN-009 Hủy đơn chưa thanh toán kèm lý do
    ORDER_ALREADY_COMPLETED_CANNOT_CANCEL(3110, "Đơn hàng đã hoàn tất thanh toán. Vui lòng sử dụng chức năng Hủy hóa đơn hoặc Lập phiếu trả hàng", HttpStatus.BAD_REQUEST),
    ORDER_CANCEL_REASON_REQUIRED(3111, "Vui lòng chọn lý do trước khi hủy đơn hàng", HttpStatus.BAD_REQUEST),
    ORDER_CANCEL_NOTE_REQUIRED(3112, "Vui lòng nhập ghi chú chi tiết khi chọn lý do khác", HttpStatus.BAD_REQUEST),
    ORDER_ALREADY_CANCELED(3113, "Đơn hàng đã ở trạng thái đã hủy trước đó", HttpStatus.BAD_REQUEST),
    ORDER_CANCEL_NOT_CREATING_STATUS(3114, "Chỉ được phép hủy đơn hàng đang trong trạng thái khởi tạo (chưa thanh toán)", HttpStatus.BAD_REQUEST),

    // NCL-03-CN-010 Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
    DINING_TABLE_NOT_FOUND(3120, "Bàn ăn không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    DINING_TABLE_NAME_DUPLICATED(3121, "Tên bàn ăn đã tồn tại trong cùng khu vực của hộ kinh doanh", HttpStatus.BAD_REQUEST),
    DINING_TABLE_IN_USE(3122, "Bàn ăn đang có đơn hàng chưa hoàn tất, không thể xóa hoặc vô hiệu hóa", HttpStatus.BAD_REQUEST),
    ORDER_CANNOT_BE_HELD(3123, "Chỉ được phép thao tác đặt tên nhận diện hoặc treo đơn đối với đơn hàng đang tạo dở (CREATING)", HttpStatus.BAD_REQUEST),
    ORDER_LABEL_OR_TABLE_REQUIRED(3124, "Vui lòng nhập tên nhận diện hoặc chọn bàn ăn để nhận diện đơn hàng", HttpStatus.BAD_REQUEST),
    DINING_TABLE_OCCUPIED(3125, "Bàn ăn này đang phục vụ một đơn hàng khác chưa hoàn tất thanh toán", HttpStatus.BAD_REQUEST),
    DINING_TABLE_INACTIVE(3126, "Bàn ăn hiện đang ngừng hoạt động, không thể gán đơn hàng mới", HttpStatus.BAD_REQUEST),
    ORDER_HOLDING_HOURS_INVALID(3127, "Cấu hình thời gian treo đơn tối đa phải từ 1 đến 72 giờ", HttpStatus.BAD_REQUEST),
    ORDER_NOT_HELD(3128, "Đơn hàng không ở trạng thái treo hoặc không tìm thấy", HttpStatus.BAD_REQUEST),
    CANNOT_SWITCH_TO_SAME_TABLE(3129, "Bàn ăn chuyển đến không được trùng với bàn hiện tại của đơn hàng", HttpStatus.BAD_REQUEST),

    // NCL-03-CN-011 Thanh toán kết hợp nhiều hình thức trên một đơn & NCL-03-CN-012 Xác nhận chuyển khoản
    PAYMENTS_EMPTY(3130, "Danh sách hình thức thanh toán không được để trống", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_METHOD(3131, "Hình thức thanh toán không hợp lệ (chỉ chấp nhận CASH, BANK_TRANSFER, DEBT)", HttpStatus.BAD_REQUEST),
    PAYMENT_AMOUNT_INVALID(3132, "Số tiền thanh toán của mỗi hình thức phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    PAYMENT_TOTAL_MISMATCH(3133, "Tổng tiền các hình thức thanh toán không khớp với số tiền cần thanh toán của đơn hàng theo QTN-03", HttpStatus.BAD_REQUEST),
    DUPLICATE_PAYMENT_METHOD(3134, "Không được lặp lại cùng một hình thức thanh toán trong một đơn hàng", HttpStatus.BAD_REQUEST),
    BANK_TRANSFER_NOT_CONFIRMED(3135, "Giao dịch chuyển khoản ngân hàng chưa được xác nhận thành công", HttpStatus.BAD_REQUEST),
    CASH_GIVEN_LESS_THAN_AMOUNT(3136, "Số tiền khách đưa cho hình thức tiền mặt phải lớn hơn hoặc bằng số tiền thanh toán", HttpStatus.BAD_REQUEST),
    ORDER_PAYMENT_NOT_FOUND(3137, "Không tìm thấy giao dịch thanh toán của đơn hàng", HttpStatus.NOT_FOUND),
    PAYMENT_ALREADY_CONFIRMED(3138, "Giao dịch chuyển khoản ngân hàng này đã được xác nhận trước đó", HttpStatus.BAD_REQUEST),
    NOT_BANK_TRANSFER_PAYMENT(3139, "Chỉ hình thức thanh toán chuyển khoản ngân hàng mới cần xác nhận", HttpStatus.BAD_REQUEST),
    PAYMENT_TRANSACTION_CODE_REQUIRED(3140, "Mã giao dịch ngân hàng không được để trống khi xác nhận đã nhận tiền", HttpStatus.BAD_REQUEST),
    ORDER_ALREADY_COMPLETED_CANNOT_CHANGE_PAYMENT(3141, "Đơn hàng đã hoàn thành, không thể thay đổi phương thức thanh toán", HttpStatus.BAD_REQUEST),
    NO_BANK_TRANSFER_PAYMENT_FOUND(3142, "Không tìm thấy khoản thanh toán chuyển khoản nào trong đơn hàng này", HttpStatus.NOT_FOUND),
    BANK_TRANSFER_TIMEOUT_INVALID(3143, "Thời gian chờ xác nhận chuyển khoản phải từ 1 đến 1440 phút (24 giờ)", HttpStatus.BAD_REQUEST),
    INVALID_PAYMENT_SWITCH_METHOD(3144, "Phương thức thanh toán chuyển đổi không hợp lệ (chỉ hỗ trợ CASH, BANK_TRANSFER, DEBT)", HttpStatus.BAD_REQUEST),

    // NCL-03-CN-013 Bàn giao ca giữa hai nhân viên
    RECIPIENT_ALREADY_HAS_OPEN_SHIFT(3061, "Người nhận ca đang có một ca khác đang mở. Vui lòng yêu cầu đóng ca cũ trước khi nhận bàn giao", HttpStatus.BAD_REQUEST),
    CANNOT_HANDOVER_TO_SELF(3062, "Không thể bàn giao ca cho chính bản thân mình", HttpStatus.BAD_REQUEST),
    RECIPIENT_NOT_FOUND(3063, "Người nhận bàn giao không tồn tại hoặc không thuộc cùng hộ kinh doanh", HttpStatus.NOT_FOUND),
    RECIPIENT_AUTHENTICATION_FAILED(3064, "Mật khẩu xác thực của người nhận ca không chính xác", HttpStatus.UNAUTHORIZED),
    HANDOVER_DIFFERENCE_REASON_REQUIRED(3065, "Số tiền bàn giao thực tế lệch so với quỹ dự kiến. Bắt buộc phải nhập lý do chênh lệch", HttpStatus.BAD_REQUEST),
    INVALID_HANDOVER_CASH(3066, "Số tiền mặt bàn giao thực tế không hợp lệ", HttpStatus.BAD_REQUEST),
    RECIPIENT_NOT_AUTHORIZED_FOR_POS(3067, "Người nhận ca chưa được phân công quầy thu ngân hoặc không có quyền bán hàng", HttpStatus.BAD_REQUEST),

    // NCL-03-CN-014 Ghi thu chi tiền mặt ngoài bán hàng trong ca
    CASH_TRANSACTION_NOT_FOUND(3070, "Phiếu thu chi tiền mặt không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    CASH_TRANSACTION_SHIFT_NOT_OPEN(3071, "Chỉ được phép tạo phiếu thu chi đối với ca bán hàng đang mở", HttpStatus.BAD_REQUEST),
    CASH_TRANSACTION_AMOUNT_INVALID(3072, "Số tiền thu chi phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    CASH_TRANSACTION_NOT_PENDING(3073, "Chỉ có thể phê duyệt hoặc từ chối phiếu chi đang ở trạng thái chờ duyệt", HttpStatus.BAD_REQUEST),
    CASH_TRANSACTION_REJECTION_REASON_REQUIRED(3074, "Vui lòng nhập lý do khi từ chối phiếu chi", HttpStatus.BAD_REQUEST),
    CASH_TRANSACTION_APPROVAL_DENIED(3075, "Chỉ chủ hộ kinh doanh mới có quyền phê duyệt hoặc từ chối phiếu chi", HttpStatus.FORBIDDEN),
    SHIFT_HAS_PENDING_EXPENSES(3076, "Ca bán hàng còn khoản chi đang chờ duyệt. Vui lòng phê duyệt hoặc từ chối trước khi chốt ca", HttpStatus.BAD_REQUEST),
    CASH_CATEGORY_NOT_FOUND(3077, "Loại thu chi không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    CASH_CATEGORY_NAME_DUPLICATE(3078, "Tên loại thu chi đã tồn tại trong danh mục của hộ kinh doanh", HttpStatus.BAD_REQUEST),
    CASH_CATEGORY_IN_USE(3079, "Loại thu chi đã phát sinh phiếu giao dịch, không thể xóa", HttpStatus.BAD_REQUEST),
    CASH_CATEGORY_TYPE_MISMATCH(3150, "Loại danh mục không khớp với phân loại phiếu (Thu hoặc Chi)", HttpStatus.BAD_REQUEST),
    EXPENSE_THRESHOLD_INVALID(3151, "Hạn mức duyệt chi của hộ kinh doanh phải lớn hơn hoặc bằng 0", HttpStatus.BAD_REQUEST),
    CASH_TRANSACTION_PERMISSION_DENIED(3152, "Bạn không có quyền thao tác trên phiếu thu chi này", HttpStatus.FORBIDDEN),
    // NCL-10-CN-007 Đối chiếu công nợ và in giấy xác nhận nợ
    DEBT_RECONCILIATION_NOT_FOUND(3160, "Biên bản đối chiếu công nợ không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    DEBT_RECONCILIATION_ALREADY_CONFIRMED(3161, "Biên bản đối chiếu công nợ này đã được xác nhận chốt sổ trước đó", HttpStatus.BAD_REQUEST),
    DEBT_RECONCILIATION_ALREADY_CANCELLED(3162, "Biên bản đối chiếu công nợ này đã bị hủy bỏ", HttpStatus.BAD_REQUEST),
    DEBT_RECONCILIATION_INVALID_DATE_RANGE(3163, "Khoảng thời gian đối chiếu không hợp lệ (Ngày bắt đầu phải trước hoặc bằng Ngày kết thúc)", HttpStatus.BAD_REQUEST),
    DEBT_RECORD_LOCKED_CANNOT_MODIFY(3164, "Khoản công nợ này đã được chốt đối chiếu và khóa sổ, không được phép chỉnh sửa hoặc xóa lùi", HttpStatus.BAD_REQUEST),
    DEBT_RECONCILIATION_FUTURE_DATE(3165, "Ngày kết thúc đối chiếu không được vượt quá ngày hiện tại", HttpStatus.BAD_REQUEST),
    DEBT_RECONCILIATION_OVERLAPPING_CONFIRMED(3166, "Khoảng thời gian này đã có biên bản đối chiếu công nợ được xác nhận chốt sổ trước đó", HttpStatus.BAD_REQUEST),
    ONLY_STORE_OWNER_CAN_RECONCILE(3167, "Chỉ chủ hộ kinh doanh mới có quyền thực hiện và chốt đối chiếu công nợ", HttpStatus.FORBIDDEN),
    DEBT_RECONCILIATION_PERIOD_BEFORE_LAST_LOCK(3168, "Ngày bắt đầu đối chiếu không được nằm trước mốc đã khóa sổ đối chiếu gần nhất của khách hàng", HttpStatus.BAD_REQUEST),
    DEBT_ADJUSTMENT_REASON_REQUIRED(3169, "Bắt buộc phải nhập lý do khi lập bút toán điều chỉnh công nợ sau mốc đối chiếu", HttpStatus.BAD_REQUEST),

    // NCL-01-CN-008 Mời và thu hồi quyền truy cập của kế toán thuê ngoài
    ACCOUNTANT_INVITATION_NOT_FOUND(2051, "Không tìm thấy lời mời kế toán", HttpStatus.NOT_FOUND),
    INVITATION_EXPIRED(2052, "Lời mời kế toán đã hết hạn hoặc không còn hiệu lực", HttpStatus.BAD_REQUEST),
    INVITATION_ALREADY_PROCESSED(2053, "Lời mời kế toán đã được xử lý trước đó", HttpStatus.BAD_REQUEST),
    ASSIGNMENT_NOT_FOUND(2057, "Không tìm thấy phân công kế toán", HttpStatus.NOT_FOUND),
    ACCOUNTANT_NOT_ASSIGNED_TO_HOUSEHOLD(2060, "Kế toán không được phân công cho hộ kinh doanh này hoặc quyền truy cập đã hết hạn", HttpStatus.FORBIDDEN),

    // NCL-01-CN-009 Quản trị nền tảng khóa và mở khóa tài khoản hộ kinh doanh
    HOUSEHOLD_LOCKED(2050, "Tài khoản hộ kinh doanh đang bị khóa. Vui lòng liên hệ Quản trị nền tảng", HttpStatus.FORBIDDEN),
    LOCK_REASON_REQUIRED(2061, "Vui lòng nhập lý do khi khóa tài khoản hộ kinh doanh", HttpStatus.BAD_REQUEST),

    // NCL-01-CN-010 Quản trị nền tảng quản lý gói dịch vụ của hộ
    PACKAGE_USER_LIMIT_EXCEEDED(2054, "Hộ kinh doanh đã đạt giới hạn tối đa người dùng của gói dịch vụ. Vui lòng nâng cấp gói để tiếp tục thêm nhân viên", HttpStatus.BAD_REQUEST),
    PACKAGE_POS_LIMIT_EXCEEDED(2062, "Hộ kinh doanh đã đạt giới hạn tối đa điểm bán của gói dịch vụ. Vui lòng nâng cấp gói để tiếp tục thêm điểm bán", HttpStatus.BAD_REQUEST),
    SERVICE_PACKAGE_NOT_FOUND(2055, "Không tìm thấy gói dịch vụ", HttpStatus.NOT_FOUND),
    SERVICE_PACKAGE_CODE_EXISTS(2056, "Mã gói dịch vụ đã tồn tại trên hệ thống", HttpStatus.BAD_REQUEST),

    // NCL-01-CN-011 Quản trị nền tảng xem nhật ký hệ thống toàn nền tảng
    PLATFORM_LOG_NOT_FOUND(2058, "Không tìm thấy bản ghi nhật ký hệ thống", HttpStatus.NOT_FOUND),
    PLATFORM_INCIDENT_NOT_FOUND(2059, "Không tìm thấy sự cố hệ thống", HttpStatus.NOT_FOUND),

    // NCL-13-CN-007 Báo cáo giá trị tồn kho theo giá vốn
    FUTURE_DATE_NOT_ALLOWED(3170, "Không thể tra cứu giá trị tồn kho tại thời điểm trong tương lai", HttpStatus.BAD_REQUEST),

    // NCL-14-CN-005 Thử phục hồi định kỳ và báo cáo tình trạng bản sao lưu
    NO_BACKUP_AVAILABLE_FOR_VERIFICATION(5035, "Không tìm thấy bản sao lưu hợp lệ nào để thực hiện thử phục hồi", HttpStatus.BAD_REQUEST),
    VERIFICATION_EXECUTION_FAILED(5036, "Quá trình chạy thử phục hồi bản sao lưu gặp sự cố kỹ thuật", HttpStatus.INTERNAL_SERVER_ERROR),
    BACKUP_VERIFICATION_NOT_FOUND(5037, "Không tìm thấy bản ghi lịch sử kiểm chứng sao lưu", HttpStatus.NOT_FOUND),
    ONLY_STORE_OWNER_CAN_VERIFY_BACKUP(5038, "Chỉ chủ hộ kinh doanh mới có quyền thực hiện thử phục hồi và xem tình trạng sao lưu", HttpStatus.FORBIDDEN);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
