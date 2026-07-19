package com.viet.sales.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    @Size(max = 36, message = "Mã khách hàng không vượt quá 36 ký tự")
    private String customerId;
}
