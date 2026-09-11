package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCashCategoryRequest {

    @NotBlank(message = "Tên loại thu chi không được để trống")
    @Size(max = 100, message = "Tên loại thu chi không được vượt quá 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả không vượt quá 500 ký tự")
    private String description;

    @NotNull(message = "Trạng thái hoạt động không được để trống")
    private Boolean isActive;
}
