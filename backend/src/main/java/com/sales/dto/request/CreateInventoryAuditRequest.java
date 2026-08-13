package com.sales.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInventoryAuditRequest {

    private String notes;

    @NotEmpty(message = "Phiếu kiểm kê phải chứa ít nhất một mặt hàng")
    @Valid
    private List<CreateInventoryAuditDetailRequest> details;
}
