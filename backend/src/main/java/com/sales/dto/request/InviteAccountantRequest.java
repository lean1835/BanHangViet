package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteAccountantRequest {

    @NotBlank(message = "Số điện thoại của kế toán không được để trống")
    private String accountantPhone;

    private String accountantEmail;

    @NotNull(message = "Thời hạn ủy quyền không được để trống")
    @Positive(message = "Thời hạn ủy quyền phải lớn hơn 0 ngày")
    private Integer accessDurationDays;

    @NotEmpty(message = "Phạm vi dữ liệu chia sẻ không được để trống")
    private List<String> scopePermissions; // e.g. ["INVOICE", "REPORT", "TAX_DECLARATION"]
}
