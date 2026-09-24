package com.sales.modules.support.service.impl;
import com.sales.common.dto.PageResponse;
import com.sales.modules.support.dto.response.FaqCategoryGroupResponse;
import com.sales.modules.support.dto.response.FaqItemResponse;
import com.sales.modules.support.dto.response.SupportChannelResponse;
import com.sales.modules.support.dto.response.SupportInfoResponse;
import com.sales.common.constant.FaqCategory;
import com.sales.modules.support.dto.request.CreateFaqItemRequest;
import com.sales.modules.support.dto.request.CreateSupportChannelRequest;
import com.sales.modules.support.dto.request.UpdateFaqItemRequest;
import com.sales.modules.support.dto.request.UpdateSupportChannelRequest;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.support.entity.FaqItem;
import com.sales.modules.support.entity.SupportChannel;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.support.repository.FaqItemRepository;
import com.sales.modules.support.repository.SupportChannelRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.support.service.FaqService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaqServiceImpl implements FaqService {

    private final FaqItemRepository faqItemRepository;
    private final SupportChannelRepository supportChannelRepository;
    private final UserRepository userRepository;
    private final Environment environment;

    private User getAuthenticatedUser(String username) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        return userRepository.findByUsername(username).orElse(null);
    }

    private boolean isPlatformAdmin(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        if (user == null || user.getRole() == null) {
            return false;
        }
        String code = user.getRole().getCode();
        String name = user.getRole().getName();
        return "VT-04".equalsIgnoreCase(code)
                || "VT-04".equalsIgnoreCase(name)
                || "Quản trị nền tảng".equalsIgnoreCase(name);
    }

    private void checkPlatformAdminPermission(String currentUsername) {
        User user = getAuthenticatedUser(currentUsername);
        if (user == null || user.getRole() == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (!isPlatformAdmin(currentUsername)) {
            throw new AppException(ErrorCode.ONLY_ADMIN_CAN_MANAGE_FAQS);
        }
    }

    private Specification<FaqItem> buildFaqSpecification(String keyword, FaqCategory category, Boolean isActiveOnly) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (isActiveOnly != null) {
                predicates.add(cb.equal(root.get("isActive"), isActiveOnly));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (StringUtils.hasText(keyword)) {
                String sanitized = keyword.trim().toLowerCase()
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_");
                String searchPattern = "%" + sanitized + "%";
                Predicate matchQuestion = cb.like(cb.lower(root.get("question")), searchPattern, '\\');
                Predicate matchAnswer = cb.like(cb.lower(root.get("answer")), searchPattern, '\\');
                Predicate matchKeywords = cb.like(cb.lower(root.get("keywords")), searchPattern, '\\');
                predicates.add(cb.or(matchQuestion, matchAnswer, matchKeywords));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FaqItemResponse> getFaqs(String keyword, FaqCategory category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("category").ascending().and(Sort.by("displayOrder").ascending()));
        Specification<FaqItem> spec = buildFaqSpecification(keyword, category, true);

        Page<FaqItem> faqPage = faqItemRepository.findAll(spec, pageable);

        List<FaqItemResponse> content = faqPage.getContent().stream()
                .map(this::mapToFaqItemResponse)
                .collect(Collectors.toList());

        return PageResponse.<FaqItemResponse>builder()
                .content(content)
                .pageNumber(faqPage.getNumber())
                .pageSize(faqPage.getSize())
                .totalElements(faqPage.getTotalElements())
                .totalPages(faqPage.getTotalPages())
                .last(faqPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaqCategoryGroupResponse> getFaqsGroupedByCategory() {
        List<FaqItem> activeFaqs = faqItemRepository.findAllByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();

        Map<FaqCategory, List<FaqItem>> groupedMap = activeFaqs.stream()
                .collect(Collectors.groupingBy(FaqItem::getCategory));

        List<FaqCategoryGroupResponse> result = new ArrayList<>();
        for (FaqCategory cat : List.of(FaqCategory.INVOICE, FaqCategory.SALES, FaqCategory.ACCOUNT, FaqCategory.DATA)) {
            List<FaqItem> itemsInGroup = groupedMap.getOrDefault(cat, Collections.emptyList());
            List<FaqItemResponse> mappedItems = itemsInGroup.stream()
                    .map(this::mapToFaqItemResponse)
                    .collect(Collectors.toList());

            result.add(FaqCategoryGroupResponse.builder()
                    .category(cat)
                    .categoryDisplayName(cat.getDisplayName())
                    .totalQuestions(mappedItems.size())
                    .questions(mappedItems)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FaqItemResponse getFaqDetailAndIncrementView(String currentUsername, String id) {
        FaqItem faq = faqItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FAQ_NOT_FOUND));

        if (!Boolean.TRUE.equals(faq.getIsActive()) && !isPlatformAdmin(currentUsername)) {
            throw new AppException(ErrorCode.FAQ_NOT_FOUND);
        }

        faqItemRepository.incrementViewCount(id);
        faq.setViewCount((faq.getViewCount() == null ? 0L : faq.getViewCount()) + 1L);

        return mapToFaqItemResponse(faq);
    }

    @Override
    @Transactional(readOnly = true)
    public SupportInfoResponse getSupportInfo(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = (currentUser != null) ? currentUser.getHousehold() : null;

        String householdId = (household != null) ? household.getId() : "PLATFORM_ADMIN";
        String householdCode = (household != null) ? household.getId() : "N/A";
        String householdName = (household != null) ? household.getName() : "Quản trị nền tảng Bán Hàng Việt";
        String taxCode = (household != null) ? household.getTaxCode() : "N/A";
        String representativeName = (household != null) ? household.getRepresentativeName() : "N/A";
        String phoneNumber = (household != null) ? household.getPhoneNumber() : "N/A";

        String userRoleCode = (currentUser != null && currentUser.getRole() != null)
                ? (currentUser.getRole().getCode() != null ? currentUser.getRole().getCode() : currentUser.getRole().getName())
                : "GUEST";
        String userFullName = (currentUser != null && currentUser.getFullName() != null)
                ? currentUser.getFullName() : (currentUsername != null ? currentUsername : "N/A");

        String systemVersion = environment.getProperty("app.system-version", "v1.2.0-STABLE");

        List<SupportChannel> channels = supportChannelRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc();
        List<SupportChannelResponse> channelResponses = channels.stream()
                .map(this::mapToSupportChannelResponse)
                .collect(Collectors.toList());

        String quickSummary = String.format(
                "Phiên bản phần mềm: %s | Mã hộ KD: %s | Mã số thuế: %s | Tên hộ: %s | Người liên hệ: %s (SĐT: %s)",
                systemVersion, householdId, taxCode, householdName, userFullName, phoneNumber
        );

        return SupportInfoResponse.builder()
                .systemVersion(systemVersion)
                .householdId(householdId)
                .householdCode(householdCode)
                .householdName(householdName)
                .taxCode(taxCode)
                .representativeName(representativeName)
                .phoneNumber(phoneNumber)
                .currentUsername(currentUsername)
                .currentUserFullName(userFullName)
                .currentUserRole(userRoleCode)
                .quickSupportSummary(quickSummary)
                .supportChannels(channelResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportChannelResponse> getActiveSupportChannels() {
        return supportChannelRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapToSupportChannelResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FaqItemResponse createFaq(String currentUsername, CreateFaqItemRequest request) {
        checkPlatformAdminPermission(currentUsername);

        if (request.getCategory() == null) {
            throw new AppException(ErrorCode.FAQ_CATEGORY_INVALID);
        }

        FaqItem faqItem = FaqItem.builder()
                .category(request.getCategory())
                .question(request.getQuestion().trim())
                .answer(request.getAnswer().trim())
                .actionUrl(request.getActionUrl() != null ? request.getActionUrl().trim() : null)
                .actionLabel(request.getActionLabel() != null ? request.getActionLabel().trim() : null)
                .keywords(request.getKeywords() != null ? request.getKeywords().trim() : null)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .viewCount(0L)
                .build();

        FaqItem saved = faqItemRepository.save(faqItem);
        log.info("Admin [{}] created new FAQ [{}] with ID [{}]", currentUsername, saved.getQuestion(), saved.getId());
        return mapToFaqItemResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public FaqItemResponse updateFaq(String currentUsername, String id, UpdateFaqItemRequest request) {
        checkPlatformAdminPermission(currentUsername);

        FaqItem faqItem = faqItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FAQ_NOT_FOUND));

        if (request.getCategory() == null) {
            throw new AppException(ErrorCode.FAQ_CATEGORY_INVALID);
        }

        faqItem.setCategory(request.getCategory());
        faqItem.setQuestion(request.getQuestion().trim());
        faqItem.setAnswer(request.getAnswer().trim());
        faqItem.setActionUrl(request.getActionUrl() != null ? request.getActionUrl().trim() : null);
        faqItem.setActionLabel(request.getActionLabel() != null ? request.getActionLabel().trim() : null);
        faqItem.setKeywords(request.getKeywords() != null ? request.getKeywords().trim() : null);
        if (request.getDisplayOrder() != null) {
            faqItem.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            faqItem.setIsActive(request.getIsActive());
        }

        FaqItem updated = faqItemRepository.save(faqItem);
        log.info("Admin [{}] updated FAQ ID [{}]", currentUsername, updated.getId());
        return mapToFaqItemResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteFaq(String currentUsername, String id) {
        checkPlatformAdminPermission(currentUsername);

        FaqItem faqItem = faqItemRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.FAQ_NOT_FOUND));

        faqItemRepository.delete(faqItem);
        log.info("Admin [{}] deleted FAQ ID [{}]", currentUsername, id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SupportChannelResponse createSupportChannel(String currentUsername, CreateSupportChannelRequest request) {
        checkPlatformAdminPermission(currentUsername);

        if (request.getChannelType() == null) {
            throw new AppException(ErrorCode.SUPPORT_CHANNEL_TYPE_INVALID);
        }

        SupportChannel channel = SupportChannel.builder()
                .channelType(request.getChannelType())
                .channelName(request.getChannelName().trim())
                .contactValue(request.getContactValue().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        SupportChannel saved = supportChannelRepository.save(channel);
        log.info("Admin [{}] created support channel [{}]", currentUsername, saved.getChannelName());
        return mapToSupportChannelResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SupportChannelResponse updateSupportChannel(String currentUsername, String id, UpdateSupportChannelRequest request) {
        checkPlatformAdminPermission(currentUsername);

        SupportChannel channel = supportChannelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_CHANNEL_NOT_FOUND));

        if (request.getChannelType() == null) {
            throw new AppException(ErrorCode.SUPPORT_CHANNEL_TYPE_INVALID);
        }

        channel.setChannelType(request.getChannelType());
        channel.setChannelName(request.getChannelName().trim());
        channel.setContactValue(request.getContactValue().trim());
        channel.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        if (request.getDisplayOrder() != null) {
            channel.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            channel.setIsActive(request.getIsActive());
        }

        SupportChannel updated = supportChannelRepository.save(channel);
        log.info("Admin [{}] updated support channel ID [{}]", currentUsername, updated.getId());
        return mapToSupportChannelResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteSupportChannel(String currentUsername, String id) {
        checkPlatformAdminPermission(currentUsername);

        SupportChannel channel = supportChannelRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SUPPORT_CHANNEL_NOT_FOUND));

        supportChannelRepository.delete(channel);
        log.info("Admin [{}] deleted support channel ID [{}]", currentUsername, id);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FaqItemResponse> getAllFaqsForAdmin(String currentUsername, String search, FaqCategory category, Boolean isActive, int page, int size) {
        checkPlatformAdminPermission(currentUsername);

        Pageable pageable = PageRequest.of(page, size, Sort.by("category").ascending().and(Sort.by("displayOrder").ascending()));
        Specification<FaqItem> spec = buildFaqSpecification(search, category, isActive);

        Page<FaqItem> faqPage = faqItemRepository.findAll(spec, pageable);

        List<FaqItemResponse> content = faqPage.getContent().stream()
                .map(this::mapToFaqItemResponse)
                .collect(Collectors.toList());

        return PageResponse.<FaqItemResponse>builder()
                .content(content)
                .pageNumber(faqPage.getNumber())
                .pageSize(faqPage.getSize())
                .totalElements(faqPage.getTotalElements())
                .totalPages(faqPage.getTotalPages())
                .last(faqPage.isLast())
                .build();
    }

    private FaqItemResponse mapToFaqItemResponse(FaqItem item) {
        return FaqItemResponse.builder()
                .id(item.getId())
                .category(item.getCategory())
                .categoryDisplayName(item.getCategory() != null ? item.getCategory().getDisplayName() : null)
                .question(item.getQuestion())
                .answer(item.getAnswer())
                .actionUrl(item.getActionUrl())
                .actionLabel(item.getActionLabel())
                .keywords(item.getKeywords())
                .displayOrder(item.getDisplayOrder())
                .viewCount(item.getViewCount())
                .isActive(item.getIsActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private SupportChannelResponse mapToSupportChannelResponse(SupportChannel sc) {
        return SupportChannelResponse.builder()
                .id(sc.getId())
                .channelType(sc.getChannelType())
                .channelTypeDisplayName(sc.getChannelType() != null ? sc.getChannelType().getDisplayName() : null)
                .channelName(sc.getChannelName())
                .contactValue(sc.getContactValue())
                .description(sc.getDescription())
                .displayOrder(sc.getDisplayOrder())
                .isActive(sc.getIsActive())
                .build();
    }
}
