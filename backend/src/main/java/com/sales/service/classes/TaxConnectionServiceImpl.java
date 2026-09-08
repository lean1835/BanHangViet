package com.sales.service.classes;

import com.sales.dto.response.TaxConnectionHistoryResponse;
import com.sales.dto.response.TaxConnectionStatusResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.TaxConnectionLog;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.TaxConnectionLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.TaxConnectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaxConnectionServiceImpl implements TaxConnectionService {

    private final TaxConnectionLogRepository logRepository;
    private final UserRepository userRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final BusinessHouseholdRepository householdRepository;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public TaxConnectionStatusResponse getTaxConnectionStatus(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold() != null ? currentUser.getHousehold().getId() : null;

        List<TaxConnectionLog> latestLogs = logRepository.findLatestLogByHousehold(
                householdId, PageRequest.of(0, 1));

        TaxConnectionLog latest = !latestLogs.isEmpty() ? latestLogs.get(0) : null;

        String status = latest != null ? latest.getStatus() : "ONLINE";
        Integer responseTimeMs = (latest != null && latest.getResponseTimeMs() != null) ? latest.getResponseTimeMs() : 0;
        LocalDateTime lastSuccessfulAt = latest != null && latest.getLastSuccessfulResponseAt() != null
                ? latest.getLastSuccessfulResponseAt()
                : LocalDateTime.now().minusMinutes(5);

        // Count pending invoices waiting in queue (status = WAITING_TAX_CODE)
        long pendingCount = householdId != null
                ? eInvoiceRepository.countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                        householdId, "WAITING_TAX_CODE", LocalDateTime.now().minusDays(30), LocalDateTime.now())
                : 0;

        String guideMessage = null;
        if ("OFFLINE".equalsIgnoreCase(status)) {
            guideMessage = "Hệ thống đang gián đoạn kết nối với Cơ quan thuế mô phỏng. Vui lòng kiểm tra lại đường truyền mạng. Tất cả hóa đơn đã lập đều được lưu trữ an toàn và hệ thống sẽ tự động gửi lại khi có mạng trở lại.";
        } else if ("SLOW".equalsIgnoreCase(status)) {
            guideMessage = "Kết nối với Cơ quan thuế mô phỏng đang bị chậm. Tiến trình xử lý cấp mã có thể mất nhiều thời gian hơn bình thường.";
        } else {
            guideMessage = "Kết nối với Cơ quan thuế mô phỏng bình thường.";
        }

        return TaxConnectionStatusResponse.builder()
                .status(status)
                .responseTimeMs(responseTimeMs)
                .lastSuccessfulResponseAt(lastSuccessfulAt)
                .pendingQueueCount((int) pendingCount)
                .userGuideMessage(guideMessage)
                .checkedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TaxConnectionHistoryResponse getTaxConnectionHistory(String currentUsername, int days) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold() != null ? currentUser.getHousehold().getId() : null;

        int safeDays = days > 0 ? days : 7;
        LocalDateTime fromDate = LocalDateTime.now().minusDays(safeDays);

        List<TaxConnectionLog> logs = logRepository.findLogsByHouseholdAndDateAfter(householdId, fromDate);

        List<TaxConnectionHistoryResponse.TaxConnectionLogItem> items = logs.stream()
                .map(l -> TaxConnectionHistoryResponse.TaxConnectionLogItem.builder()
                        .id(l.getId())
                        .status(l.getStatus())
                        .responseTimeMs(l.getResponseTimeMs())
                        .lastSuccessfulResponseAt(l.getLastSuccessfulResponseAt())
                        .pendingQueueCount(l.getPendingQueueCount())
                        .errorMessage(l.getErrorMessage())
                        .createdAt(l.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TaxConnectionHistoryResponse.builder()
                .householdId(householdId)
                .totalLogs(items.size())
                .historyLogs(items)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void recordConnectionEvent(String householdId, String status, Integer responseTimeMs, String errorMessage) {
        BusinessHousehold household = householdId != null
                ? householdRepository.findById(householdId).orElse(null)
                : null;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastSuccess = "ONLINE".equalsIgnoreCase(status) ? now : null;

        long pendingCount = householdId != null
                ? eInvoiceRepository.countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                        householdId, "WAITING_TAX_CODE", now.minusDays(30), now)
                : 0;

        TaxConnectionLog logItem = TaxConnectionLog.builder()
                .household(household)
                .status(status)
                .responseTimeMs(responseTimeMs)
                .lastSuccessfulResponseAt(lastSuccess)
                .pendingQueueCount((int) pendingCount)
                .errorMessage(errorMessage)
                .build();

        logRepository.save(logItem);
        log.info("Đã ghi nhận nhật ký kết nối cơ quan thuế: status={}, householdId={}", status, householdId);
    }
}
