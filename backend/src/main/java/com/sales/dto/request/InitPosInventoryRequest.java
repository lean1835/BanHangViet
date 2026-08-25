package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitPosInventoryRequest {

    @NotEmpty(message = "Danh sách hàng hóa khai báo tồn không được để trống")
    @Valid
    private List<PosInventoryItemRequest> items;
}
