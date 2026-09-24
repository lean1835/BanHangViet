package com.sales.modules.customer.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyProgramConfigRequest {

    @NotNull(message = "Trạng thái kích hoạt không được để trống")
    private Boolean isEnabled;

    @NotNull(message = "Số tiền tương ứng 1 điểm không được để trống")
    @DecimalMin(value = "100.00", message = "Số tiền tương ứng 1 điểm phải từ 100đ trở lên")
    private BigDecimal spendAmountPerPoint;

    @NotNull(message = "Giá trị quy đổi 1 điểm không được để trống")
    @DecimalMin(value = "1.00", message = "Giá trị quy đổi 1 điểm phải từ 1đ trở lên")
    private BigDecimal pointValue;

    @NotNull(message = "Mức điểm tối thiểu để đổi không được để trống")
    @Min(value = 0, message = "Mức điểm tối thiểu không được âm")
    private Integer minPointsToRedeem;

    @NotNull(message = "Tỷ lệ đổi điểm tối đa trên đơn không được để trống")
    @DecimalMin(value = "1.00", message = "Tỷ lệ đổi điểm tối đa phải từ 1% trở lên")
    @DecimalMax(value = "100.00", message = "Tỷ lệ đổi điểm tối đa không vượt quá 100%")
    private BigDecimal maxRedeemRatePerOrder;

    @NotNull(message = "Hạn sử dụng điểm không được để trống")
    @Min(value = 0, message = "Hạn sử dụng điểm không được âm (0 nghĩa là không hết hạn)")
    private Integer pointExpiryDays;
}
