package com.sales.constant;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Getter
@AllArgsConstructor
public enum RoundingRule {
    HALF_UP("Làm tròn chuẩn (>= 0.5 lên 1, < 0.5 xuống 0)"),
    UP("Luôn làm tròn lên đồng gần nhất"),
    DOWN("Cắt phần lẻ (làm tròn xuống)"),
    ROUND_TO_100("Làm tròn đến 100 đồng gần nhất"),
    ROUND_TO_1000("Làm tròn đến 1.000 đồng gần nhất");

    private final String description;

    public BigDecimal applyRounding(BigDecimal exactAmount) {
        if (exactAmount == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        switch (this) {
            case UP:
                return exactAmount.setScale(0, RoundingMode.UP).setScale(2, RoundingMode.HALF_UP);
            case DOWN:
                return exactAmount.setScale(0, RoundingMode.DOWN).setScale(2, RoundingMode.HALF_UP);
            case ROUND_TO_100:
                return exactAmount.divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            case ROUND_TO_1000:
                return exactAmount.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(1000))
                        .setScale(2, RoundingMode.HALF_UP);
            case HALF_UP:
            default:
                return exactAmount.setScale(0, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);
        }
    }
}
