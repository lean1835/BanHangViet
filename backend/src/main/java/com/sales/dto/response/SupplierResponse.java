package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {
    private String id;
    private String householdId;
    private String code;
    private String name;
    private String phoneNumber;
    private String email;
    private String address;
    private String taxCode;
    private String groupName;
    private String companyName;
    private String note;
    private BigDecimal currentDebt;
    private BigDecimal totalPurchase;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getPhone() {
        return phoneNumber;
    }

    public void setPhone(String phone) {
        this.phoneNumber = phone;
    }

    public String getNotes() {
        return note;
    }

    public void setNotes(String notes) {
        this.note = notes;
    }

    public static class SupplierResponseBuilder {
        public SupplierResponseBuilder phone(String phone) {
            this.phoneNumber = phone;
            return this;
        }

        public SupplierResponseBuilder notes(String notes) {
            this.note = notes;
            return this;
        }
    }
}
