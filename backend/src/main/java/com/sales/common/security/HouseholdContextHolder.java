package com.sales.common.security;
import com.sales.modules.auth.entity.BusinessHousehold;

public final class HouseholdContextHolder {

    private static final ThreadLocal<BusinessHousehold> CURRENT_HOUSEHOLD = new ThreadLocal<>();

    private HouseholdContextHolder() {
    }

    public static void setHousehold(BusinessHousehold household) {
        CURRENT_HOUSEHOLD.set(household);
    }

    public static BusinessHousehold getHousehold() {
        return CURRENT_HOUSEHOLD.get();
    }

    public static void clear() {
        CURRENT_HOUSEHOLD.remove();
    }
}
