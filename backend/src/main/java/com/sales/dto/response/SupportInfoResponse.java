package com.sales.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportInfoResponse {
    // Thông tin kỹ thuật hệ thống
    private String systemVersion;

    // Thông tin định danh hộ kinh doanh
    private String householdId;
    private String householdCode;
    private String householdName;
    private String taxCode;
    private String representativeName;
    private String phoneNumber;

    // Thông tin người dùng hiện tại
    private String currentUsername;
    private String currentUserFullName;
    private String currentUserRole;

    // Chuỗi văn bản tóm tắt định dạng sẵn để người dùng bấm copy 1 chạm đọc cho tổng đài
    private String quickSupportSummary;

    // Danh sách các kênh liên hệ hỗ trợ
    private List<SupportChannelResponse> supportChannels;
}
