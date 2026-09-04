package com.sales.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sales.constant.PosTransferStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PosTransferResponse {

    private String id;
    private String transferNumber;

    private String fromPointOfSaleId;
    private String fromPointOfSaleName;
    private String fromPosCode;

    private String toPointOfSaleId;
    private String toPointOfSaleName;
    private String toPosCode;

    private String createdByUserId;
    private String createdByFullName;

    private String receivedByUserId;
    private String receivedByFullName;

    private String canceledByUserId;
    private String canceledByFullName;

    private PosTransferStatus status;
    private Integer totalItems;
    private BigDecimal totalQuantity;
    private String notes;
    private String cancelReason;

    private LocalDateTime transferredAt;
    private LocalDateTime receivedAt;
    private LocalDateTime canceledAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<PosTransferItemResponse> items;
}
