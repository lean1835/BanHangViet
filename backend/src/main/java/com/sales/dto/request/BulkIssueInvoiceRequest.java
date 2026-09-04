package com.sales.dto.request;

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
public class BulkIssueInvoiceRequest {

    private String syncSessionCode;

    @NotEmpty(message = "Danh sách mã đơn bán hàng không được để trống")
    private List<String> orderIds;
}
