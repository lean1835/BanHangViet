package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCancelStatDto {
    private String employeeId;
    private String employeeUsername;
    private String employeeFullName;
    private long count;
    private BigDecimal totalAmount;
}
