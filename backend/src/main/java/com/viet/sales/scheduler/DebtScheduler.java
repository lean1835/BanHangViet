package com.viet.sales.scheduler;

import com.viet.sales.entity.CustomerDebt;
import com.viet.sales.repository.CustomerDebtRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DebtScheduler {

    private final CustomerDebtRepository customerDebtRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional(rollbackFor = Exception.class)
    public void scanAndMarkOverdueDebts() {
        log.info("Starting background job to scan and mark overdue debts");
        List<CustomerDebt> expiredDebts = customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                List.of("PENDING"), "DEBT_CREATED", LocalDateTime.now());
        if (!expiredDebts.isEmpty()) {
            for (CustomerDebt debt : expiredDebts) {
                debt.setStatus("OVERDUE");
            }
            customerDebtRepository.saveAll(expiredDebts);
            log.info("Marked {} debts as OVERDUE", expiredDebts.size());
        }
    }
}
