package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerLoyaltySummaryResponse {
    private String customerId;
    private String customerName;
    private String phoneNumber;
    private Integer availablePoints;             // Số điểm khả dụng hiện tại
    private BigDecimal monetaryEquivalent;       // Giá trị tiền quy đổi tương đương
    private Boolean isEligibleToRedeem;          // Đã đủ điều kiện điểm tối thiểu để đổi chưa
    private Integer minPointsToRedeem;           // Ngưỡng điểm tối thiểu cấu hình
    private Integer totalPointsEarned;           // Tổng điểm đã tích lũy từ trước đến nay
    private Integer totalPointsRedeemed;         // Tổng điểm đã tiêu dùng từ trước đến nay
    private Integer totalPointsDeductedOnReturn; // Tổng điểm bị trừ do trả hàng
    private LocalDate nearestExpiringDate;       // Ngày hết hạn của lô điểm gần nhất
    private Integer pointsExpiringSoon;          // Số điểm sắp hết hạn trong 30 ngày tới
}
