package com.sales.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInvoiceNumberRangeRequest {

    @NotBlank(message = "Mẫu số hóa đơn không được để trống")
    private String invoicePattern;

    @NotBlank(message = "Ký hiệu hóa đơn không được để trống")
    private String invoiceSymbol;

    @NotNull(message = "Số bắt đầu không được để trống")
    @Min(value = 1, message = "Số bắt đầu phải lớn hơn hoặc bằng 1")
    private Integer startNumber;

    @NotNull(message = "Số kết thúc không được để trống")
    @Min(value = 1, message = "Số kết thúc phải lớn hơn hoặc bằng 1")
    private Integer endNumber;

    @NotNull(message = "Ngưỡng cảnh báo không được để trống")
    @Min(value = 1, message = "Ngưỡng cảnh báo phải lớn hơn hoặc bằng 1")
    private Integer warningThreshold;
}
