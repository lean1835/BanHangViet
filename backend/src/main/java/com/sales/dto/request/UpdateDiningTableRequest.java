package com.sales.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDiningTableRequest {

    @NotBlank(message = "Tên bàn ăn không được để trống")
    @Size(max = 100, message = "Tên bàn ăn không vượt quá 100 ký tự")
    private String name;

    @Size(max = 100, message = "Tên khu vực không vượt quá 100 ký tự")
    private String area;

    @NotNull(message = "Số lượng chỗ ngồi không được để trống")
    @Min(value = 1, message = "Số lượng chỗ ngồi phải tối thiểu 1 chỗ")
    @Max(value = 500, message = "Số lượng chỗ ngồi không vượt quá 500")
    @Builder.Default
    private Integer seatCapacity = 4;

    @Builder.Default
    private Integer sortOrder = 0;

    @Builder.Default
    private Boolean isActive = true;
}
