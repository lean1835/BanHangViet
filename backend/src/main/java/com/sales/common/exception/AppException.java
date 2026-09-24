package com.sales.common.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final ErrorCode errorCode;
    private String actionUrl;
    private String guideScreenCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String actionUrl, String guideScreenCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.actionUrl = actionUrl;
        this.guideScreenCode = guideScreenCode;
    }
}
