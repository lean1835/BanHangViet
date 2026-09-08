package com.sales.dto.request;

import com.sales.constant.AdjustmentType;
import com.sales.constant.PriceRoundingMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyPriceAdjustmentRequest {

    @NotBlank(message = "Tên đợt điều chỉnh giá không được để trống")
    @Size(max = 255, message = "Tên đợt không vượt quá 255 ký tự")
    private String name;

    private String targetGroupId;
    private List<String> productIds;

    @NotNull(message = "Cơ chế điều chỉnh không được để trống")
    private AdjustmentType adjustmentType;

    @NotNull(message = "Giá trị điều chỉnh không được để trống")
    private BigDecimal adjustmentValue;

    @Builder.Default
    private PriceRoundingMethod roundingMethod = PriceRoundingMethod.NONE;
}
