package com.sales.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignBarcodeRequest {

    @NotBlank(message = "Mã vạch không được để trống")
    @Size(max = 100, message = "Mã vạch không vượt quá 100 ký tự")
    private String barcode;
}
