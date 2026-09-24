package com.sales.modules.support.dto.request;
import com.sales.common.constant.FaqCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFaqItemRequest {

    @NotNull(message = "Nhóm câu hỏi không được để trống")
    private FaqCategory category;

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Size(max = 500, message = "Nội dung câu hỏi không được vượt quá 500 ký tự")
    private String question;

    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    private String answer;

    @Size(max = 255, message = "Đường dẫn màn hình liên quan không được vượt quá 255 ký tự")
    private String actionUrl;

    @Size(max = 100, message = "Nhãn nút bấm không được vượt quá 100 ký tự")
    private String actionLabel;

    @Size(max = 500, message = "Từ khóa tìm kiếm không được vượt quá 500 ký tự")
    private String keywords;

    @Min(value = 0, message = "Thứ tự hiển thị phải lớn hơn hoặc bằng 0")
    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Boolean isActive = true;
}
