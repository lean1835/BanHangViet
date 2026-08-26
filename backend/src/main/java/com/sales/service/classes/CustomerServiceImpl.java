package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateCustomerRequest;
import com.sales.dto.request.UpdateCustomerRequest;
import com.sales.dto.response.CustomerResponse;
import com.sales.entity.ActivityLog;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.CustomerDebtRepository;
import com.sales.repository.CustomerRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "customers", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for customer", e);
        }
    }

    private Map<String, Object> buildCustomerLogMap(Customer customer) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", customer.getId());
        map.put("name", customer.getName());
        map.put("phoneNumber", customer.getPhoneNumber());
        map.put("email", customer.getEmail());
        map.put("address", customer.getAddress());
        map.put("creditLimit", customer.getCreditLimit());
        map.put("currentDebt", customer.getCurrentDebt());
        map.put("discountRate", customer.getDiscountRate());
        map.put("discountType", customer.getDiscountType());
        map.put("totalSpent", customer.getTotalSpent());
        map.put("isVip", customer.getIsVip());
        map.put("reminderDaysBefore", customer.getReminderDaysBefore());
        map.put("reminderDaysAfter", customer.getReminderDaysAfter());
        return map;
    }

    private CustomerResponse mapToResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .householdId(customer.getHousehold().getId())
                .name(customer.getName())
                .phoneNumber(customer.getPhoneNumber())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .creditLimit(customer.getCreditLimit())
                .currentDebt(customer.getCurrentDebt())
                .discountRate(customer.getDiscountRate())
                .discountType(customer.getDiscountType())
                .totalSpent(customer.getTotalSpent())
                .isVip(customer.getIsVip())
                .reminderDaysBefore(customer.getReminderDaysBefore())
                .reminderDaysAfter(customer.getReminderDaysAfter())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    private boolean isStoreOwner(User user) {
        return user != null && user.getRole() != null &&
                ("VT-01".equals(user.getRole().getCode()) || "OWNER".equalsIgnoreCase(user.getRole().getCode()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerResponse createCustomer(String currentUsername, CreateCustomerRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Kiểm tra trùng SĐT trong cùng Hộ kinh doanh
        if (customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull(request.getPhoneNumber(), household.getId()).isPresent()) {
            throw new AppException(ErrorCode.CUSTOMER_PHONE_EXISTS);
        }

        BigDecimal creditLimit = request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO;
        BigDecimal discountRate = request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO;
        String discountType = request.getDiscountType() != null ? request.getDiscountType() : "PERCENTAGE";
        Boolean isVip = request.getIsVip() != null ? request.getIsVip() : false;
        Integer reminderDaysBefore = request.getReminderDaysBefore() != null ? request.getReminderDaysBefore() : 3;
        Integer reminderDaysAfter = request.getReminderDaysAfter() != null ? request.getReminderDaysAfter() : 3;

        if (!isStoreOwner(currentUser) && (discountRate.compareTo(BigDecimal.ZERO) > 0 || Boolean.TRUE.equals(isVip))) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Customer customer = Customer.builder()
                .household(household)
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .address(request.getAddress())
                .creditLimit(creditLimit)
                .currentDebt(BigDecimal.ZERO)
                .discountRate(discountRate)
                .discountType(discountType)
                .totalSpent(BigDecimal.ZERO)
                .isVip(isVip)
                .reminderDaysBefore(reminderDaysBefore)
                .reminderDaysAfter(reminderDaysAfter)
                .build();

        customer = customerRepository.save(customer);

        logActivity(household, currentUser, "CREATE_CUSTOMER", customer.getId(), null, buildCustomerLogMap(customer));

        return mapToResponse(customer);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerResponse updateCustomer(String currentUsername, String customerId, UpdateCustomerRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        // Kiểm tra trùng SĐT nếu thay đổi số điện thoại
        if (!customer.getPhoneNumber().equals(request.getPhoneNumber())) {
            if (customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull(request.getPhoneNumber(), household.getId()).isPresent()) {
                throw new AppException(ErrorCode.CUSTOMER_PHONE_EXISTS);
            }
        }

        Map<String, Object> oldLogMap = buildCustomerLogMap(customer);

        customer.setName(request.getName());
        customer.setPhoneNumber(request.getPhoneNumber());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        if (request.getCreditLimit() != null) {
            customer.setCreditLimit(request.getCreditLimit());
        }
        if (request.getDiscountRate() != null && request.getDiscountRate().compareTo(customer.getDiscountRate()) != 0) {
            if (!isStoreOwner(currentUser)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            customer.setDiscountRate(request.getDiscountRate());
        }
        if (request.getDiscountType() != null && !request.getDiscountType().equalsIgnoreCase(customer.getDiscountType())) {
            if (!isStoreOwner(currentUser)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            customer.setDiscountType(request.getDiscountType());
        }
        if (request.getIsVip() != null && !request.getIsVip().equals(customer.getIsVip())) {
            if (!isStoreOwner(currentUser)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            customer.setIsVip(request.getIsVip());
        }
        if (request.getReminderDaysBefore() != null) {
            customer.setReminderDaysBefore(request.getReminderDaysBefore());
        }
        if (request.getReminderDaysAfter() != null) {
            customer.setReminderDaysAfter(request.getReminderDaysAfter());
        }

        customer = customerRepository.save(customer);

        logActivity(household, currentUser, "UPDATE_CUSTOMER", customer.getId(), oldLogMap, buildCustomerLogMap(customer));

        return mapToResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomer(String currentUsername, String customerId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        return mapToResponse(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> getCustomers(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<Customer> customers = customerRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
        return customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> searchCustomers(String currentUsername, String query) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<Customer> customers = customerRepository.searchCustomers(household.getId(), query);
        return customers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCustomer(String currentUsername, String customerId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        if (customer.getCurrentDebt() != null && customer.getCurrentDebt().compareTo(BigDecimal.ZERO) != 0) {
            throw new AppException(ErrorCode.CUSTOMER_HAS_OUTSTANDING_DEBT);
        }

        boolean hasActiveDebts = customerDebtRepository.existsByCustomerIdAndHouseholdIdAndStatusIn(
                customer.getId(), household.getId(), List.of("PENDING", "OVERDUE"));
        if (hasActiveDebts) {
            throw new AppException(ErrorCode.CUSTOMER_HAS_OUTSTANDING_DEBT);
        }

        Map<String, Object> oldLogMap = buildCustomerLogMap(customer);

        customer.setDeletedAt(LocalDateTime.now());
        customerRepository.save(customer);

        logActivity(household, currentUser, "DELETE_CUSTOMER", customer.getId(), oldLogMap, null);
    }
}
