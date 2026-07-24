package com.viet.sales.dto.response;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncCheckResponse {
    private List<String> duplicates;
    private List<String> conflicts;
}
