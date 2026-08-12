package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateSupplierRequest;
import com.sales.dto.request.UpdateSupplierRequest;
import com.sales.dto.response.SupplierResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Supplier;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.GoodsReceiptRepository;
import com.sales.repository.SupplierRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.SupplierService;
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
public class SupplierServiceImpl implements SupplierService {

    private final UserRepository userRepository;
    private final SupplierRepository supplierRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
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
                    household, actor, action, "suppliers", targetId, oldStr, newStr, clientIp, userAgent
            );
        } catch (Exception e) {
            log.error("Failed to log activity for supplier", e);
        }
    }

    private Map<String, Object> buildSupplierLogMap(Supplier supplier) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", supplier.getId());
        map.put("name", supplier.getName());
        map.put("phoneNumber", supplier.getPhoneNumber());
        map.put("email", supplier.getEmail());
        map.put("address", supplier.getAddress());
        map.put("taxCode", supplier.getTaxCode());
        map.put("note", supplier.getNote());
        map.put("currentDebt", supplier.getCurrentDebt());
        return map;
    }

    private SupplierResponse mapToResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .householdId(supplier.getHousehold().getId())
                .name(supplier.getName())
                .phoneNumber(supplier.getPhoneNumber())
                .email(supplier.getEmail())
                .address(supplier.getAddress())
                .taxCode(supplier.getTaxCode())
                .note(supplier.getNote())
                .currentDebt(supplier.getCurrentDebt() != null ? supplier.getCurrentDebt() : BigDecimal.ZERO)
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public SupplierResponse createSupplier(String currentUsername, CreateSupplierRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        if (supplierRepository.existsByHouseholdIdAndPhoneNumberAndDeletedAtIsNull(household.getId(), request.getPhoneNumber())) {
            throw new AppException(ErrorCode.SUPPLIER_PHONE_EXISTS);
        }

        Supplier supplier = Supplier.builder()
                .household(household)
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .address(request.getAddress())
                .taxCode(request.getTaxCode())
                .note(request.getNote())
                .build();

        Supplier savedSupplier = supplierRepository.save(supplier);
        logActivity(household, user, "CREATE_SUPPLIER", savedSupplier.getId(), null, buildSupplierLogMap(savedSupplier));

        return mapToResponse(savedSupplier);
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(String currentUsername, String id, UpdateSupplierRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        Supplier supplier = supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));

        if (supplierRepository.existsByHouseholdIdAndPhoneNumberAndIdNotAndDeletedAtIsNull(household.getId(), request.getPhoneNumber(), id)) {
            throw new AppException(ErrorCode.SUPPLIER_PHONE_EXISTS);
        }

        Map<String, Object> oldMap = buildSupplierLogMap(supplier);

        supplier.setName(request.getName());
        supplier.setPhoneNumber(request.getPhoneNumber());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setTaxCode(request.getTaxCode());
        supplier.setNote(request.getNote());

        Supplier updatedSupplier = supplierRepository.save(supplier);
        logActivity(household, user, "UPDATE_SUPPLIER", updatedSupplier.getId(), oldMap, buildSupplierLogMap(updatedSupplier));

        return mapToResponse(updatedSupplier);
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplier(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        Supplier supplier = supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));
        return mapToResponse(supplier);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> getSuppliers(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        List<Supplier> suppliers = supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull(user.getHousehold().getId());
        return suppliers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> searchSuppliers(String currentUsername, String query) {
        User user = getAuthenticatedUser(currentUsername);
        if (query == null || query.trim().isEmpty()) {
            return getSuppliers(currentUsername);
        }
        List<Supplier> suppliers = supplierRepository.searchSuppliers(user.getHousehold().getId(), query.trim());
        return suppliers.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSupplier(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        Supplier supplier = supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.SUPPLIER_NOT_FOUND));

        if (supplier.getCurrentDebt() != null && supplier.getCurrentDebt().compareTo(BigDecimal.ZERO) > 0) {
            throw new AppException(ErrorCode.SUPPLIER_HAS_OUTSTANDING_DEBT);
        }

        if (goodsReceiptRepository.existsBySupplierId(id)) {
            throw new AppException(ErrorCode.SUPPLIER_HAS_DEPENDENCIES);
        }

        Map<String, Object> oldMap = buildSupplierLogMap(supplier);

        supplier.setDeletedAt(LocalDateTime.now());
        supplierRepository.save(supplier);

        logActivity(household, user, "DELETE_SUPPLIER", supplier.getId(), oldMap, null);
    }
}
