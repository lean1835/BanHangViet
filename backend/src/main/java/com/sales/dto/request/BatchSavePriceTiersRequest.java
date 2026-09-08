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
public class BatchSavePriceTiersRequest {

    @Valid
    @NotEmpty(message = "Danh sách bậc giá không được để trống")
    private List<CreatePriceTierRequest> tiers;

    @Builder.Default
    private Boolean confirmBelowCost = false;
}
