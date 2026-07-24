package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateCustomerRequest;
import com.viet.sales.dto.request.UpdateCustomerRequest;
import com.viet.sales.dto.response.CustomerResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Customer;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.CustomerRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.CustomerService;
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
    private final ActivityLogRepository activityLogRepository;
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

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable("customers")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
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
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
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

        Customer customer = Customer.builder()
                .household(household)
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .address(request.getAddress())
                .creditLimit(creditLimit)
                .currentDebt(BigDecimal.ZERO)
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

        if (customer.getCurrentDebt() != null && customer.getCurrentDebt().compareTo(BigDecimal.ZERO) > 0) {
            throw new AppException(ErrorCode.CUSTOMER_HAS_OUTSTANDING_DEBT);
        }

        Map<String, Object> oldLogMap = buildCustomerLogMap(customer);

        customer.setDeletedAt(LocalDateTime.now());
        customerRepository.save(customer);

        logActivity(household, currentUser, "DELETE_CUSTOMER", customer.getId(), oldLogMap, null);
    }
}
