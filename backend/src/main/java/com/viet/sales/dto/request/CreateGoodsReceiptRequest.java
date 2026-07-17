package com.viet.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PastOrPresent;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGoodsReceiptRequest {

    private String receiptNumber;

    @PastOrPresent(message = "Ngày nhập kho không được là ngày trong tương lai")
    private LocalDateTime receivedAt;

    private String notes;

    @NotEmpty(message = "Phiếu nhập kho phải chứa ít nhất một mặt hàng")
    @Valid
    private List<CreateGoodsReceiptDetailRequest> details;
}
