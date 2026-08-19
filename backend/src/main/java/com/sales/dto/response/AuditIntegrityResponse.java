package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditIntegrityResponse {

    private boolean isValid;
    private long totalRecordsChecked;
    private Long corruptedSequenceNumber;
    private String corruptedLogId;
    private String failureReason;
    private LocalDateTime verifiedAt;
}
