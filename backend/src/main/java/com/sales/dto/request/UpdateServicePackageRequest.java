package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateServicePackageRequest {

    @NotBlank(message = "Tên gói dịch vụ không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Số người dùng tối đa không được để trống")
    @Positive(message = "Số người dùng tối đa phải lớn hơn 0")
    private Integer maxUsers;

    @NotNull(message = "Số điểm bán tối đa không được để trống")
    @Positive(message = "Số điểm bán tối đa phải lớn hơn 0")
    private Integer maxPosPoints;

    @NotNull(message = "Số hóa đơn tối đa mỗi tháng không được để trống")
    @Positive(message = "Số hóa đơn tối đa mỗi tháng phải lớn hơn 0")
    private Integer maxInvoicesPerMonth;

    @NotNull(message = "Thời gian lưu trữ dữ liệu không được để trống")
    @Positive(message = "Thời gian lưu trữ phải lớn hơn 0 ngày")
    private Integer dataRetentionDays;

    @NotNull(message = "Giá gói không được để trống")
    private BigDecimal price;

    private Boolean isActive;
}
