package com.sales.service;

import com.sales.dto.response.TaxConnectionHistoryResponse;
import com.sales.dto.response.TaxConnectionStatusResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.TaxConnectionLog;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.TaxConnectionLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.TaxConnectionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxConnectionServiceTest {

    @Mock
    private TaxConnectionLogRepository logRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private BusinessHouseholdRepository householdRepository;

    @InjectMocks
    private TaxConnectionServiceImpl taxConnectionService;

    private User ownerUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Hộ Tạp Hóa Việt")
                .taxCode("0123456789")
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();

        ownerUser = User.builder()
                .id("user-001")
                .username("chuho")
                .household(household)
                .role(roleOwner)
                .build();
    }

    @Test
    @DisplayName("NCL-04-CN-010-TC-01: Trạng thái kết nối ONLINE khi phản hồi bình thường")
    void getTaxConnectionStatus_Online() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        TaxConnectionLog log = TaxConnectionLog.builder()
                .id("log-1")
                .household(household)
                .status("ONLINE")
                .responseTimeMs(100)
                .lastSuccessfulResponseAt(LocalDateTime.now())
                .pendingQueueCount(0)
                .build();

        when(logRepository.findLatestLogByHousehold(eq("house-001"), any(Pageable.class)))
                .thenReturn(List.of(log));

        TaxConnectionStatusResponse response = taxConnectionService.getTaxConnectionStatus("chuho");

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("ONLINE");
        assertThat(response.getUserGuideMessage()).contains("bình thường");
    }

    @Test
    @DisplayName("NCL-04-CN-010-TC-02: Trạng thái kết nối OFFLINE -> Trả về hướng dẫn khắc phục cho người dùng")
    void getTaxConnectionStatus_Offline_WithUserGuide() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        TaxConnectionLog log = TaxConnectionLog.builder()
                .id("log-2")
                .household(household)
                .status("OFFLINE")
                .responseTimeMs(null)
                .lastSuccessfulResponseAt(LocalDateTime.now().minusHours(1))
                .pendingQueueCount(5)
                .errorMessage("Mất kết nối mô phỏng")
                .build();

        when(logRepository.findLatestLogByHousehold(eq("house-001"), any(Pageable.class)))
                .thenReturn(List.of(log));

        TaxConnectionStatusResponse response = taxConnectionService.getTaxConnectionStatus("chuho");

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("OFFLINE");
        assertThat(response.getUserGuideMessage()).contains("gián đoạn").contains("lưu trữ an toàn");
    }

    @Test
    @DisplayName("NCL-04-CN-010-TC-03: Xem lịch sử kết nối 7 ngày gần nhất")
    void getTaxConnectionHistory_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        TaxConnectionLog log1 = TaxConnectionLog.builder()
                .id("log-1")
                .household(household)
                .status("ONLINE")
                .createdAt(LocalDateTime.now().minusDays(1))
                .build();

        when(logRepository.findLogsByHouseholdAndDateAfter(eq("house-001"), any(LocalDateTime.class)))
                .thenReturn(List.of(log1));

        TaxConnectionHistoryResponse response = taxConnectionService.getTaxConnectionHistory("chuho", 7);

        assertThat(response).isNotNull();
        assertThat(response.getHouseholdId()).isEqualTo("house-001");
        assertThat(response.getTotalLogs()).isEqualTo(1);
        assertThat(response.getHistoryLogs().get(0).getStatus()).isEqualTo("ONLINE");
    }

    @Test
    @DisplayName("NCL-04-CN-010-TC-02: 3 lần gửi lỗi liên tiếp -> Tự động chuyển sang trạng thái OFFLINE (F-06)")
    void recordConnectionEvent_AutoTransitionToOffline() {
        TaxConnectionLog failed1 = TaxConnectionLog.builder().id("l1").status("SLOW").errorMessage("Lỗi 1").build();
        TaxConnectionLog failed2 = TaxConnectionLog.builder().id("l2").status("SLOW").errorMessage("Lỗi 2").build();

        when(logRepository.findTop2ByHouseholdIdOrderByCreatedAtDesc("house-001"))
                .thenReturn(List.of(failed1, failed2));

        taxConnectionService.recordConnectionEvent("house-001", "SLOW", 500, "Lỗi lần 3");

        org.mockito.ArgumentCaptor<TaxConnectionLog> captor = org.mockito.ArgumentCaptor.forClass(TaxConnectionLog.class);
        verify(logRepository).save(captor.capture());

        TaxConnectionLog savedLog = captor.getValue();
        assertThat(savedLog.getStatus()).isEqualTo("OFFLINE");
    }

    @Test
    @DisplayName("NCL-04-CN-010: Không giả mạo timestamp (F-06) -> Trả về null khi chưa từng phản hồi thành công")
    void getTaxConnectionStatus_NoFakeTimestamp() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(logRepository.findLatestLogByHousehold(eq("house-001"), any(Pageable.class)))
                .thenReturn(List.of());
        when(logRepository.findFirstByHouseholdIdAndLastSuccessfulResponseAtIsNotNullOrderByCreatedAtDesc("house-001"))
                .thenReturn(Optional.empty());

        TaxConnectionStatusResponse response = taxConnectionService.getTaxConnectionStatus("chuho");

        assertThat(response).isNotNull();
        assertThat(response.getLastSuccessfulResponseAt()).isNull();
    }

    @Test
    @DisplayName("NCL-04-CN-010: Mô phỏng trạng thái kết nối (simulateConnection)")
    void simulateConnection_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(householdRepository.findById("house-001")).thenReturn(Optional.of(household));

        TaxConnectionLog simulatedLog = TaxConnectionLog.builder()
                .id("sim-1")
                .household(household)
                .status("OFFLINE")
                .responseTimeMs(0)
                .errorMessage("Mô phỏng ngắt kết nối")
                .build();

        when(logRepository.findLatestLogByHousehold(eq("house-001"), any(Pageable.class)))
                .thenReturn(List.of(simulatedLog));

        TaxConnectionStatusResponse response = taxConnectionService.simulateConnection("chuho", "OFFLINE", null, null);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("OFFLINE");
        verify(logRepository).save(any(TaxConnectionLog.class));
    }
}

