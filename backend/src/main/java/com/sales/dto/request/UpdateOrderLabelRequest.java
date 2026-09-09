package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrderLabelRequest {

    @NotBlank(message = "Tên nhận diện không được để trống")
    @Size(max = 100, message = "Tên nhận diện đơn hàng không vượt quá 100 ký tự")
    private String orderLabel;
}
