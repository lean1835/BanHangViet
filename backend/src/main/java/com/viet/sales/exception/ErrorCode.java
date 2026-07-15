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
    INVALID_INPUT(2006, "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
