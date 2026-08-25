package com.sales.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignPosEmployeeRequest {

    @NotEmpty(message = "Danh sách mã nhân viên không được để trống")
    private List<String> userIds;
}
