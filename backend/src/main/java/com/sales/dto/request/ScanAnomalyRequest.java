package com.sales.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAnomalyRequest {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate scanDate;
}
