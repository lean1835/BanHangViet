package com.sales.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScreenGuideStepRequest {

    @NotNull(message = "Thứ tự bước không được để trống")
    @Min(value = 1, message = "Thứ tự bước phải từ 1")
    @Max(value = 5, message = "Thứ tự bước tối đa là 5")
    private Integer stepNumber;

    @NotBlank(message = "Tiêu đề bước không được để trống")
    @Size(max = 255, message = "Tiêu đề bước không quá 255 ký tự")
    private String title;

    @NotBlank(message = "Nội dung bước không được để trống")
    private String content;

    @Size(max = 100, message = "Selector phần tử không quá 100 ký tự")
    private String targetElementSelector;

    @Size(max = 100, message = "Nhãn nút bấm không quá 100 ký tự")
    private String buttonLabel;

    @Size(max = 500, message = "Đường dẫn ảnh không quá 500 ký tự")
    private String imageUrl;
}
