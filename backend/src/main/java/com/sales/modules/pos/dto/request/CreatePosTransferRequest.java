package com.sales.modules.pos.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePosTransferRequest {

    private String fromPointOfSaleId;

    private String toPointOfSaleId;

    private String notes;

    @NotEmpty(message = "Danh sách mặt hàng chuyển không được để trống")
    @Valid
    private List<PosTransferItemRequest> items;
}
