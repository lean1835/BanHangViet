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

    private String returnNumber; // Tùy chọn, tự động sinh nếu để trống (TH-NCC-...)

    private LocalDateTime returnDate; // Mặc định thời điểm hiện tại nếu null

    @NotBlank(message = "Vui lòng chọn hoặc nhập lý do trả hàng")
    private String reason; // Hàng hỏng, Cận hạn, Sai quy cách, Giao thừa, Khác

    private String notes;

    @NotEmpty(message = "Phiếu trả hàng phải chứa ít nhất một mặt hàng")
    @Valid
    private List<CreateSupplierReturnItemRequest> items;
}
