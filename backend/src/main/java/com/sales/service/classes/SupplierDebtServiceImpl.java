package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.dto.request.PaySupplierDebtRequest;
import com.sales.dto.response.SupplierDebtResponse;
import com.sales.dto.response.SupplierDebtSummaryResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.SupplierDebtRepository;
import com.sales.repository.SupplierRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.SupplierDebtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupplierDebtServiceImpl implements SupplierDebtService {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierDebtRepository supplierDebtRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        return user;
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(
                    household, actor, action, "supplier_debts", targetId, oldStr, newStr, clientIp, userAgent
            );
        } catch (Exception e) {
            log.error("Failed to write activity log for supplier debt", e);
        }
    }

    private Map<String, Object> buildDebtLogMap(SupplierDebt debt) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", debt.getId());
        map.put("supplierId", debt.getSupplier() != null ? debt.getSupplier().getId() : null);
        map.put("amount", debt.getAmount());
        map.put("remainingAmount", debt.getRemainingAmount());
        map.put("type", debt.getType());
        map.put("status", debt.getStatus());
        map.put("goodsReceiptId", debt.getGoodsReceipt() != null ? debt.getGoodsReceipt().getId() : null);
        map.put("dueDate", debt.getDueDate());
        map.put("paymentMethod", debt.getPaymentMethod());
        map.put("notes", debt.getNotes());
        return map;
    }

    private SupplierDebtResponse mapToResponse(SupplierDebt debt) {
        return SupplierDebtResponse.builder()
                .id(debt.getId())
                .householdId(debt.getHousehold() != null ? debt.getHousehold().getId() : null)
                .supplierId(debt.getSupplier() != null ? debt.getSupplier().getId() : null)
                .supplierName(debt.getSupplier() != null ? debt.getSupplier().getName() : null)
                .goodsReceiptId(debt.getGoodsReceipt() != null ? debt.getGoodsReceipt().getId() : null)
                .receiptNumber(debt.getGoodsReceipt() != null ? debt.getGoodsReceipt().getReceiptNumber() : null)
                .amount(debt.getAmount())
                .remainingAmount(debt.getRemainingAmount())
                .type(debt.getType())
                .status(debt.getStatus())
                .dueDate(debt.getDueDate())
                .paymentMethod(debt.getPaymentMethod())
                .notes(debt.getNotes())
                .createdByUserId(debt.getCreatedByUser() != null ? debt.getCreatedByUser().getId() : null)
                .createdByUserName(debt.getCreatedByUser() != null ? debt.getCreatedByUser().getFullName() : null)
                .createdAt(debt.getCreatedAt())
                .updatedAt(debt.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void recordGoodsReceiptDebt(BusinessHousehold household, Supplier supplier, GoodsReceipt receipt, User actor) {
        if (supplier == null || receipt == null || receipt.getTotalAmount() == null || receipt.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        SupplierDebt debtRecord = SupplierDebt.builder()
                .household(household)
                .supplier(supplier)
                .goodsReceipt(receipt)
                .amount(receipt.getTotalAmount())
                .remainingAmount(receipt.getTotalAmount())
                .type(DebtType.DEBT_CREATED)
                .status(DebtStatus.PENDING)
                .createdByUser(actor)
                .notes("Tự động sinh công nợ từ phiếu nhập kho: " + receipt.getReceiptNumber())
                .build();

        supplierDebtRepository.save(debtRecord);

        BigDecimal currentDebt = supplier.getCurrentDebt() != null ? supplier.getCurrentDebt() : BigDecimal.ZERO;
        supplier.setCurrentDebt(currentDebt.add(receipt.getTotalAmount()));
        supplierRepository.save(supplier);

        logActivity(household, actor, "CREATE_SUPPLIER_DEBT", debtRecord.getId(), null, buildDebtLogMap(debtRecord));
    }

    @Override
    @Transactional
    public SupplierDebtResponse paySupplierDebt(String currentUsername, PaySupplierDebtRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        Supplier supplier = supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getSupplierId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_SUPPLIER_PAYMENT_AMOUNT);
        }

        List<SupplierDebt> activeDebts = supplierDebtRepository.findBySupplierIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                supplier.getId(),
                household.getId(),
                List.of(DebtStatus.PENDING, DebtStatus.OVERDUE),
                DebtType.DEBT_CREATED
        );

        BigDecimal amountToPay = request.getAmount();
        List<SupplierDebt> updatedDebts = new ArrayList<>();

        for (SupplierDebt debt : activeDebts) {
            if (amountToPay.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal remaining = debt.getRemainingAmount();
            if (amountToPay.compareTo(remaining) >= 0) {
                amountToPay = amountToPay.subtract(remaining);
                debt.setRemainingAmount(BigDecimal.ZERO);
                debt.setStatus(DebtStatus.PAID);
            } else {
                debt.setRemainingAmount(remaining.subtract(amountToPay));
                amountToPay = BigDecimal.ZERO;
            }
            updatedDebts.add(debt);
        }

        if (!updatedDebts.isEmpty()) {
            supplierDebtRepository.saveAll(updatedDebts);
        }

        SupplierDebt paymentRecord = SupplierDebt.builder()
                .household(household)
                .supplier(supplier)
                .amount(request.getAmount())
                .remainingAmount(BigDecimal.ZERO)
                .type(DebtType.DEBT_PAID)
                .status(DebtStatus.PAID)
                .dueDate(request.getDueDate())
                .paymentMethod(StringUtils.hasText(request.getPaymentMethod()) ? request.getPaymentMethod() : "CASH")
                .notes(request.getNotes())
                .createdByUser(user)
                .build();

        SupplierDebt savedPayment = supplierDebtRepository.save(paymentRecord);

        BigDecimal currentSupplierDebt = supplier.getCurrentDebt() != null ? supplier.getCurrentDebt() : BigDecimal.ZERO;
        BigDecimal newSupplierDebt = currentSupplierDebt.subtract(request.getAmount());
        if (newSupplierDebt.compareTo(BigDecimal.ZERO) < 0) {
            newSupplierDebt = BigDecimal.ZERO;
        }
        supplier.setCurrentDebt(newSupplierDebt);
        supplierRepository.save(supplier);

        logActivity(household, user, "PAY_SUPPLIER_DEBT", savedPayment.getId(), null, buildDebtLogMap(savedPayment));

        return mapToResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierDebtResponse> getSupplierDebtHistory(String currentUsername, String supplierId) {
        User user = getAuthenticatedUser(currentUsername);
        Supplier supplier = supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(supplierId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));

        List<SupplierDebt> debts = supplierDebtRepository.findBySupplierIdAndHouseholdIdOrderByCreatedAtDesc(
                supplier.getId(), user.getHousehold().getId()
        );

        return debts.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierDebtResponse> getSupplierDebts(String currentUsername, String statusFilter) {
        User user = getAuthenticatedUser(currentUsername);
        String householdId = user.getHousehold().getId();

        List<SupplierDebt> debts;
        if (StringUtils.hasText(statusFilter)) {
            debts = supplierDebtRepository.findByHouseholdIdAndStatusInAndTypeOrderByCreatedAtDesc(
                    householdId, List.of(statusFilter.toUpperCase()), DebtType.DEBT_CREATED
            );
        } else {
            debts = supplierDebtRepository.findByHouseholdIdOrderByCreatedAtDesc(householdId);
        }

        return debts.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierDebtSummaryResponse getSupplierDebtSummary(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        String householdId = user.getHousehold().getId();

        BigDecimal totalOutstanding = supplierDebtRepository.sumTotalOutstandingDebtByHouseholdId(householdId);
        long suppliersWithDebt = supplierDebtRepository.countSuppliersWithDebtByHouseholdId(householdId);
        BigDecimal totalOverdue = supplierDebtRepository.sumTotalOverdueDebtByHouseholdId(householdId);

        return SupplierDebtSummaryResponse.builder()
                .totalOutstandingDebt(totalOutstanding != null ? totalOutstanding : BigDecimal.ZERO)
                .totalSuppliersWithDebt(suppliersWithDebt)
                .totalOverdueDebt(totalOverdue != null ? totalOverdue : BigDecimal.ZERO)
                .build();
    }
}
