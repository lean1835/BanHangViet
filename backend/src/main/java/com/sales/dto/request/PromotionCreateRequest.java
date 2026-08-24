package com.sales.dto.request;

import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionCreateRequest {

    @NotBlank(message = "Tên chương trình khuyến mại không được để trống")
    @Size(max = 255, message = "Tên chương trình khuyến mại không được vượt quá 255 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không được vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Loại giảm giá không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Mức giảm giá không được để trống")
    @DecimalMin(value = "0.01", message = "Mức giảm giá phải lớn hơn 0")
    private BigDecimal discountValue;

    @NotNull(message = "Phạm vi áp dụng không được để trống")
    private PromotionApplyScope applyScope;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startDate;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endDate;

    private List<String> productIds;

    private List<String> productGroupIds;
}
