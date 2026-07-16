package com.viet.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductGroupRequest {

    @NotBlank(message = "Tên nhóm hàng không được để trống")
    @Size(max = 100, message = "Tên nhóm hàng không được vượt quá 100 ký tự")
    private String name;

    private List<String> productIds;
}
