package com.sales.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarcodePrintRequest {

    @Pattern(regexp = "^(58mm|80mm|standard)$", message = "Khổ giấy in chỉ hỗ trợ: 58mm, 80mm, standard")
    @Builder.Default
    private String paperSize = "58mm";

    @Min(value = 1, message = "Số lượng tem in tối thiểu là 1")
    @Builder.Default
    private Integer quantity = 1;
}
