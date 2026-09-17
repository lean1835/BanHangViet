package com.sales.dto.request;

import com.sales.constant.SupportChannelType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupportChannelRequest {

    @NotNull(message = "Loại kênh hỗ trợ không được để trống")
    private SupportChannelType channelType;

    @NotBlank(message = "Tên kênh hỗ trợ không được để trống")
    @Size(max = 100, message = "Tên kênh không được vượt quá 100 ký tự")
    private String channelName;

    @NotBlank(message = "Giá trị liên hệ không được để trống")
    @Size(max = 255, message = "Giá trị liên hệ không được vượt quá 255 ký tự")
    private String contactValue;

    @Size(max = 255, message = "Mô tả không được vượt quá 255 ký tự")
    private String description;

    @Min(value = 0, message = "Thứ tự hiển thị phải lớn hơn hoặc bằng 0")
    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Boolean isActive = true;
}
