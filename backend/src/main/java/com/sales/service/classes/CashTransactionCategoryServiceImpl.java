package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.CashTransactionType;
import com.sales.dto.request.CreateCashCategoryRequest;
import com.sales.dto.request.UpdateCashCategoryRequest;
import com.sales.dto.response.CashTransactionCategoryResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.CashTransactionCategory;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.CashTransactionCategoryRepository;
import com.sales.repository.CashTransactionRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.CashTransactionCategoryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashTransactionCategoryServiceImpl implements CashTransactionCategoryService {

    private final CashTransactionCategoryRepository categoryRepository;
    private final CashTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
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

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "cash_transaction_categories", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for cash category", e);
        }
    }

    private synchronized void initDefaultCategoriesIfEmpty(BusinessHousehold household) {
        List<CashTransactionCategory> existing = categoryRepository.findByHouseholdIdAndDeletedAtIsNullOrderByNameAsc(household.getId());
        if (existing.isEmpty()) {
            List<CashTransactionCategory> defaults = List.of(
                    CashTransactionCategory.builder().household(household).name("Nạp tiền lẻ thối").type(CashTransactionType.INCOME).description("Nạp bổ sung tiền lẻ vào két tiền ca").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Thu hoàn ứng").type(CashTransactionType.INCOME).description("Nhân viên hoặc shipper hoàn tiền tạm ứng").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Thu tiền khác ngoài bán hàng").type(CashTransactionType.INCOME).description("Khoản thu tiền mặt khác").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Mua túi gói hàng / đồ dùng quầy").type(CashTransactionType.EXPENSE).description("Chi mua bao bì, túi bóng, băng keo, đá lạnh...").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Trả cước shipper ngoài").type(CashTransactionType.EXPENSE).description("Chi trả tiền ship ngoài cho đơn hàng").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Chi mua hàng lẻ khẩn cấp").type(CashTransactionType.EXPENSE).description("Chi tiền mặt mua hàng bổ sung gấp").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Chi ăn ca / nước uống").type(CashTransactionType.EXPENSE).description("Chi tiền ăn trưa, nước uống cho nhân viên").isSystemDefault(true).isActive(true).build(),
                    CashTransactionCategory.builder().household(household).name("Chi khác ngoài bán hàng").type(CashTransactionType.EXPENSE).description("Các khoản chi tiền mặt vặt khác").isSystemDefault(true).isActive(true).build()
            );
            List<CashTransactionCategory> toSave = defaults.stream()
                    .filter(d -> !categoryRepository.existsByHouseholdIdAndNameAndTypeAndDeletedAtIsNull(household.getId(), d.getName(), d.getType()))
                    .collect(Collectors.toList());
            if (!toSave.isEmpty()) {
                categoryRepository.saveAll(toSave);
            }
        }
    }

    @Override
    @Transactional
    public List<CashTransactionCategoryResponse> getCategories(String currentUsername, CashTransactionType type) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        initDefaultCategoriesIfEmpty(household);

        List<CashTransactionCategory> list;
        if (type != null) {
            list = categoryRepository.findByHouseholdIdAndTypeAndDeletedAtIsNullAndIsActiveTrueOrderByNameAsc(household.getId(), type);
        } else {
            list = categoryRepository.findByHouseholdIdAndDeletedAtIsNullAndIsActiveTrueOrderByNameAsc(household.getId());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CashTransactionCategoryResponse createCategory(String currentUsername, CreateCashCategoryRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String name = request.getName().trim();
        if (categoryRepository.existsByHouseholdIdAndNameAndTypeAndDeletedAtIsNull(household.getId(), name, request.getType())) {
            throw new AppException(ErrorCode.CASH_CATEGORY_NAME_DUPLICATE);
        }

        CashTransactionCategory category = CashTransactionCategory.builder()
                .household(household)
                .name(name)
                .type(request.getType())
                .description(request.getDescription())
                .isActive(true)
                .isSystemDefault(false)
                .build();

        category = categoryRepository.save(category);

        Map<String, Object> logMap = new HashMap<>();
        logMap.put("name", category.getName());
        logMap.put("type", category.getType().name());
        logActivity(household, user, "CREATE_CASH_CATEGORY", category.getId(), null, logMap);

        return mapToResponse(category);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CashTransactionCategoryResponse updateCategory(String currentUsername, String categoryId, UpdateCashCategoryRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        CashTransactionCategory category = categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(categoryId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CASH_CATEGORY_NOT_FOUND));

        String newName = request.getName().trim();
        if (categoryRepository.existsByHouseholdIdAndNameAndTypeAndIdNotAndDeletedAtIsNull(household.getId(), newName, category.getType(), categoryId)) {
            throw new AppException(ErrorCode.CASH_CATEGORY_NAME_DUPLICATE);
        }

        Map<String, Object> oldMap = new HashMap<>();
        oldMap.put("name", category.getName());
        oldMap.put("isActive", category.getIsActive());

        category.setName(newName);
        category.setDescription(request.getDescription());
        category.setIsActive(request.getIsActive());

        category = categoryRepository.save(category);

        Map<String, Object> newMap = new HashMap<>();
        newMap.put("name", category.getName());
        newMap.put("isActive", category.getIsActive());
        logActivity(household, user, "UPDATE_CASH_CATEGORY", category.getId(), oldMap, newMap);

        return mapToResponse(category);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteCategory(String currentUsername, String categoryId) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        CashTransactionCategory category = categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(categoryId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CASH_CATEGORY_NOT_FOUND));

        // Check if category has been used in transactions
        if (transactionRepository.existsByCategoryId(categoryId)) {
            throw new AppException(ErrorCode.CASH_CATEGORY_IN_USE);
        }

        category.setDeletedAt(LocalDateTime.now());
        categoryRepository.save(category);

        logActivity(household, user, "DELETE_CASH_CATEGORY", category.getId(), category.getName(), null);
    }

    private CashTransactionCategoryResponse mapToResponse(CashTransactionCategory cat) {
        return CashTransactionCategoryResponse.builder()
                .id(cat.getId())
                .name(cat.getName())
                .type(cat.getType())
                .description(cat.getDescription())
                .isActive(cat.getIsActive())
                .isSystemDefault(cat.getIsSystemDefault())
                .createdAt(cat.getCreatedAt())
                .updatedAt(cat.getUpdatedAt())
                .build();
    }
}
