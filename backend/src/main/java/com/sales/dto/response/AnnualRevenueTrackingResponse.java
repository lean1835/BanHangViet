package com.sales.dto.response;

import com.sales.constant.RevenueWarningStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnualRevenueTrackingResponse {
    private Integer year;
    private String householdId;
    private String householdName;
    private String taxCode;

    /** Ngưỡng bắt buộc pháp lý: 1.000.000.000 VNĐ */
    private BigDecimal mandatoryThreshold;

    /** Mức cảnh báo do chủ hộ đặt (%): ví dụ 80.00% */
    private BigDecimal warningThresholdPercentage;

    /** Giá trị doanh thu kích hoạt cảnh báo: ví dụ 800.000.000 VNĐ */
    private BigDecimal warningRevenueAmount;

    /** Doanh thu lũy kế thực tế từ đầu năm đến hiện tại */
    private BigDecimal cumulativeRevenue;

    /** Tổng tiền thuế tương ứng của các HĐ hợp lệ */
    private BigDecimal cumulativeTaxAmount;

    /** Số lượng hóa đơn hợp lệ đã cấp mã */
    private Integer validInvoiceCount;

    /** Tỷ lệ hoàn thành so với ngưỡng 1 tỷ (%) */
    private BigDecimal thresholdPercentage;

    /** Tốc độ doanh thu trung bình theo tháng (VNĐ/tháng) */
    private BigDecimal averageMonthlyRevenue;

    /** Số tháng đã trôi qua tính đến thời điểm khảo sát */
    private Integer elapsedMonths;

    /** Thời điểm dự kiến chạm ngưỡng 1 tỷ đồng (nếu giữ nguyên tốc độ) */
    private LocalDate projectedReachDate;

    /** Cờ đánh dấu ngày dự kiến có nằm trong năm dương lịch hiện tại hay không */
    private Boolean projectedInCurrentYear;

    /** Doanh thu còn lại cần đạt để chạm mốc 1 tỷ */
    private BigDecimal remainingRevenueToThreshold;

    /** Trạng thái cảnh báo hiện tại */
    private RevenueWarningStatus warningStatus;

    /** Cờ đánh dấu hộ thuộc diện bắt buộc */
    private Boolean isMandatory;

    /** Cờ đánh dấu hộ đã thuộc diện bắt buộc từ đầu năm (TC-03) */
    private Boolean isMandatoryFromBeginning;

    /** Cờ điều khiển hiển thị cảnh báo trên giao diện người dùng */
    private Boolean shouldShowWarning;

    /** Tiêu đề và nội dung cảnh báo ngắn */
    private String warningMessage;

    /** Văn bản trích dẫn nghĩa vụ pháp lý theo NĐ 123/2020/NĐ-CP & TT 78/2021/TT-BTC */
    private String legalObligationNotice;

    /** Chi tiết phân rã doanh thu từng tháng trong năm */
    private List<MonthlyRevenueBreakdownResponse> monthlyBreakdown;
}
