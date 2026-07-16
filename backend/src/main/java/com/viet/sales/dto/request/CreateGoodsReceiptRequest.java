package com.viet.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGoodsReceiptRequest {

    private String receiptNumber;

    private LocalDateTime receivedAt;

    private String notes;

    @NotEmpty(message = "Phiếu nhập kho phải chứa ít nhất một mặt hàng")
    @Valid
    private List<CreateGoodsReceiptDetailRequest> details;
}
