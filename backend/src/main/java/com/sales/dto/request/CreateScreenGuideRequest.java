package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateScreenGuideRequest {

    @NotBlank(message = "Mã màn hình không được để trống")
    @Size(max = 50, message = "Mã màn hình không quá 50 ký tự")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Mã màn hình chỉ bao gồm chữ HOA, số và dấu gạch dưới")
    private String screenCode;

    @NotBlank(message = "Tên màn hình không được để trống")
    @Size(max = 255, message = "Tên màn hình không quá 255 ký tự")
    private String screenName;

    @Size(max = 500, message = "Mô tả màn hình không quá 500 ký tự")
    private String description;

    @Size(max = 255, message = "Đường dẫn mở màn hình không quá 255 ký tự")
    private String actionUrl;

    @Pattern(regexp = "^(ALL|VT-01|VT-02|VT-03)$", message = "Vai trò mục tiêu chỉ chấp nhận ALL, VT-01, VT-02, VT-03")
    private String targetRole;

    @NotNull(message = "Danh sách các bước hướng dẫn không được để trống")
    @Size(min = 3, max = 5, message = "Hướng dẫn màn hình phải bao gồm từ 3 đến 5 bước ngắn gọn")
    @Valid
    private List<CreateScreenGuideStepRequest> steps;
}
