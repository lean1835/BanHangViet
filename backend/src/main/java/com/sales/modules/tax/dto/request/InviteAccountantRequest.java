package com.sales.modules.tax.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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

    private String accountantName;

    @NotBlank(message = "Số điện thoại của kế toán không được để trống")
    @Pattern(regexp = "^0[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09)")
    private String accountantPhone;

    @jakarta.validation.constraints.Email(message = "Email không đúng định dạng")
    private String accountantEmail;

    @NotNull(message = "Thời hạn ủy quyền không được để trống")
    @Positive(message = "Thời hạn ủy quyền phải lớn hơn 0 ngày")
    private Integer accessDurationDays;

    @NotEmpty(message = "Phạm vi dữ liệu chia sẻ không được để trống")
    private List<String> scopePermissions; // e.g. ["INVOICE", "REPORT", "TAX_DECLARATION"]

    private String createAccountMode; // "AUTO_GENERATE" or "MANUAL_PASSWORD"

    private String initialPassword;
}
