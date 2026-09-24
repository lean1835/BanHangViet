package com.sales.modules.pos.dto.response;

import java.math.BigDecimal;
import java.sql.Date;

public interface PosDailyRevenueProjection {
    Date getSalesDate();
    String getPosId();
    String getPosName();
    Long getOrderCount();
    BigDecimal getNetRevenue();
}
