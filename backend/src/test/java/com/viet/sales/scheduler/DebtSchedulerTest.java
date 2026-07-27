package com.viet.sales.scheduler;

import com.viet.sales.entity.CustomerDebt;
import com.viet.sales.repository.CustomerDebtRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DebtSchedulerTest {

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @InjectMocks
    private DebtScheduler debtScheduler;

    @Test
    @DisplayName("Tác vụ quét nợ quá hạn - Cập nhật thành công các khoản nợ đã đến hạn")
    void scanAndMarkOverdueDebts_Success() {
        CustomerDebt expiredDebt = CustomerDebt.builder()
                .id("debt-expired")
                .amount(new java.math.BigDecimal("100000.00"))
                .remainingAmount(new java.math.BigDecimal("100000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .dueDate(LocalDateTime.now().minusDays(1))
                .build();

        List<CustomerDebt> expiredList = new ArrayList<>();
        expiredList.add(expiredDebt);

        when(customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                eq(List.of("PENDING")), eq("DEBT_CREATED"), any(LocalDateTime.class)))
                .thenReturn(expiredList);

        debtScheduler.scanAndMarkOverdueDebts();

        assertEquals("OVERDUE", expiredDebt.getStatus());
        verify(customerDebtRepository, times(1)).saveAll(expiredList);
    }

    @Test
    @DisplayName("Tác vụ quét nợ quá hạn - Không làm gì nếu không có khoản nợ nào quá hạn")
    void scanAndMarkOverdueDebts_NoExpiredDebts_NoAction() {
        when(customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                eq(List.of("PENDING")), eq("DEBT_CREATED"), any(LocalDateTime.class)))
                .thenReturn(List.of());

        debtScheduler.scanAndMarkOverdueDebts();

        verify(customerDebtRepository, never()).saveAll(any());
    }
}
