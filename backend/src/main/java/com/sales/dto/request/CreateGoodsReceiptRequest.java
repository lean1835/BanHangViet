package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGoodsReceiptRequest {

    @Size(max = 36, message = "Mã nhà cung cấp không vượt quá 36 ký tự")
    private String supplierId;

    @Size(max = 50, message = "Số phiếu nhập kho không được vượt quá 50 ký tự")
    private String receiptNumber;

    @PastOrPresent(message = "Ngày nhập kho không được là ngày trong tương lai")
    private LocalDateTime receivedAt;

    private String notes;

    @NotEmpty(message = "Phiếu nhập kho phải chứa ít nhất một mặt hàng")
    @Valid
    private List<CreateGoodsReceiptDetailRequest> details;
}
