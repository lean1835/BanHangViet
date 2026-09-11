package com.sales.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Getter
@AllArgsConstructor
public enum PriceRoundingMethod {
    NONE("Không làm tròn (giữ nguyên số lẻ)"),
    ROUND_TO_100("Làm tròn đến 100 đồng gần nhất"),
    ROUND_TO_500("Làm tròn đến 500 đồng gần nhất"),
    ROUND_TO_1000("Làm tròn đến 1.000 đồng gần nhất");

    private final String description;

    public BigDecimal apply(BigDecimal price) {
        if (price == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (price.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        switch (this) {
            case ROUND_TO_100:
                return price.divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
            case ROUND_TO_500:
                return price.divide(BigDecimal.valueOf(500), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(500)).setScale(2, RoundingMode.HALF_UP);
            case ROUND_TO_1000:
                return price.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(1000)).setScale(2, RoundingMode.HALF_UP);
            case NONE:
            default:
                return price.setScale(2, RoundingMode.HALF_UP);
        }
    }
}
