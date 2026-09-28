package com.sales.modules.supplier.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierReturnRequest {
    @NotBlank(message = "Mã phiếu nhập kho gốc không được để trống")
    private String receiptId;

    private String returnNumber;

    private LocalDateTime returnDate;

    @NotBlank(message = "Vui lòng chọn hoặc nhập lý do trả hàng")
    private String reason;

    private String notes;

    @NotEmpty(message = "Phiếu trả hàng phải chứa ít nhất một mặt hàng")
    @Valid
    private List<CreateSupplierReturnItemRequest> items;
}
