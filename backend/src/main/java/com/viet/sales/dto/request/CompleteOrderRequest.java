package com.viet.sales.dto.request;

import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteOrderRequest {
    @DecimalMin(value = "0.0", message = "Số tiền khách đưa không được nhỏ hơn 0")
    private BigDecimal amountGiven;

    private LocalDateTime dueDate;
}
