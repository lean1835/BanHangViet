package com.sales.modules.support.service.impl;
import com.sales.common.dto.PageResponse;
import com.sales.modules.support.dto.response.ContextualGuideResponse;
import com.sales.modules.support.dto.response.GuideStepCountProjection;
import com.sales.modules.support.dto.response.ScreenGuideResponse;
import com.sales.modules.support.dto.response.ScreenGuideStepResponse;
import com.sales.modules.support.dto.response.ScreenGuideSummaryResponse;
import com.sales.modules.support.dto.response.ScreenGuideTopViewedResponse;
import com.sales.modules.support.dto.response.ScreenGuideViewStatsProjection;
import com.sales.modules.support.dto.request.CreateScreenGuideRequest;
import com.sales.modules.support.dto.request.CreateScreenGuideStepRequest;
import com.sales.modules.support.dto.request.TrackScreenGuideViewRequest;
import com.sales.modules.support.dto.request.UpdateScreenGuideRequest;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.support.entity.ScreenGuide;
import com.sales.modules.support.entity.ScreenGuideStep;
import com.sales.modules.support.entity.ScreenGuideViewLog;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.support.repository.ScreenGuideRepository;
import com.sales.modules.support.repository.ScreenGuideStepRepository;
import com.sales.modules.support.repository.ScreenGuideViewLogRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.support.service.ScreenGuideService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenGuideServiceImpl implements ScreenGuideService {

    private final ScreenGuideRepository screenGuideRepository;
    private final ScreenGuideStepRepository screenGuideStepRepository;
    private final ScreenGuideViewLogRepository screenGuideViewLogRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(String username) {
        if (username == null) return null;
        return userRepository.findByUsername(username).orElse(null);
    }

    private boolean isPlatformAdmin(User user) {
        if (user == null || user.getRole() == null) return false;
        String code = user.getRole().getCode();
        String name = user.getRole().getName();
        return "VT-04".equalsIgnoreCase(code) || "VT-04".equalsIgnoreCase(name) || "Quản trị nền tảng".equalsIgnoreCase(name);
    }

    private void checkAdminPermission(User user) {
        if (!isPlatformAdmin(user)) {
            throw new AppException(ErrorCode.ONLY_ADMIN_CAN_MANAGE_GUIDES);
        }
    }

    private void validateSteps(List<CreateScreenGuideStepRequest> steps) {
        if (steps == null || steps.size() < 3 || steps.size() > 5) {
            throw new AppException(ErrorCode.INVALID_SCREEN_GUIDE_STEPS);
        }

        Set<Integer> stepNumbers = new HashSet<>();
        for (CreateScreenGuideStepRequest step : steps) {
            if (step.getStepNumber() == null || step.getStepNumber() < 1 || step.getStepNumber() > steps.size()) {
                throw new AppException(ErrorCode.INVALID_SCREEN_GUIDE_STEPS);
            }
            if (!stepNumbers.add(step.getStepNumber())) {
                throw new AppException(ErrorCode.INVALID_SCREEN_GUIDE_STEPS);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ScreenGuideResponse getGuideByScreenCode(String currentUsername, String screenCode) {
        ScreenGuide guide = screenGuideRepository.findByScreenCodeAndIsActiveTrue(screenCode)
                .orElseThrow(() -> new AppException(ErrorCode.SCREEN_GUIDE_NOT_FOUND));

        if (guide.getTargetRole() != null && !"ALL".equalsIgnoreCase(guide.getTargetRole())) {
            User user = getAuthenticatedUser(currentUsername);
            if (user == null) {
                throw new AppException(ErrorCode.UNAUTHORIZED);
            }
            boolean isPlatformAdmin = isPlatformAdmin(user);
            String roleCode = user.getRole() != null ? user.getRole().getCode() : "";
            String roleName = user.getRole() != null ? user.getRole().getName() : "";
            boolean roleMatched = guide.getTargetRole().equalsIgnoreCase(roleCode) || guide.getTargetRole().equalsIgnoreCase(roleName);
            if (!isPlatformAdmin && !roleMatched) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        List<ScreenGuideStep> steps = screenGuideStepRepository.findByGuideIdOrderByStepNumberAsc(guide.getId());
        return mapToScreenGuideResponse(guide, steps);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void trackGuideView(String currentUsername, String screenCode, TrackScreenGuideViewRequest request) {
        if (!screenGuideRepository.existsByScreenCode(screenCode)) {
            throw new AppException(ErrorCode.SCREEN_GUIDE_NOT_FOUND);
        }

        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = (user != null) ? user.getHousehold() : null;

        screenGuideRepository.incrementViewCount(screenCode);

        int duration = (request != null && request.getDurationSeconds() != null) ? request.getDurationSeconds() : 0;
        boolean completed = (request != null && Boolean.TRUE.equals(request.getCompleted()));

        ScreenGuideViewLog viewLog = ScreenGuideViewLog.builder()
                .screenCode(screenCode)
                .household(household)
                .user(user)
                .durationSeconds(duration)
                .completed(completed)
                .build();

        screenGuideViewLogRepository.save(viewLog);
        log.debug("Tracked view for screenCode={} user={} duration={} completed={}",
                screenCode, currentUsername, duration, completed);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScreenGuideTopViewedResponse> getTopViewedGuides(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        Pageable pageable = PageRequest.of(0, safeLimit);
        List<ScreenGuide> topGuides = screenGuideRepository.findAllByIsActiveTrueOrderByViewCountDesc(pageable);

        if (topGuides.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> screenCodes = topGuides.stream().map(ScreenGuide::getScreenCode).collect(Collectors.toList());
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<ScreenGuideViewStatsProjection> statsList = screenGuideViewLogRepository.getAggregatedStatsByScreenCodes(screenCodes, sevenDaysAgo);
        Map<String, ScreenGuideViewStatsProjection> statsMap = statsList.stream()
                .collect(Collectors.toMap(ScreenGuideViewStatsProjection::getScreenCode, s -> s, (s1, s2) -> s1));

        return topGuides.stream().map(guide -> {
            ScreenGuideViewStatsProjection stats = statsMap.get(guide.getScreenCode());
            Long recentViews = (stats != null && stats.getRecentViews() != null) ? stats.getRecentViews() : 0L;
            Double avgDuration = (stats != null && stats.getAvgDuration() != null) ? stats.getAvgDuration() : 0.0;
            Long totalCompleted = (stats != null && stats.getTotalCompleted() != null) ? stats.getTotalCompleted() : 0L;
            Long totalLogged = (stats != null && stats.getTotalLogged() != null) ? stats.getTotalLogged() : 0L;

            double completionRate = (totalLogged > 0)
                    ? (double) totalCompleted / totalLogged * 100.0
                    : 0.0;

            return ScreenGuideTopViewedResponse.builder()
                    .screenCode(guide.getScreenCode())
                    .screenName(guide.getScreenName())
                    .actionUrl(guide.getActionUrl())
                    .targetRole(guide.getTargetRole())
                    .totalViews(guide.getViewCount())
                    .recent7DaysViews(recentViews)
                    .averageDurationSeconds(Math.round(avgDuration * 10.0) / 10.0)
                    .completionRatePercentage(Math.round(completionRate * 10.0) / 10.0)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ContextualGuideResponse getContextualHelpByErrorCode(int errorCode) {
        if (errorCode == ErrorCode.INVOICE_TEMPLATE_NOT_FOUND.getCode()) {
            return ContextualGuideResponse.builder()
                    .errorCode(errorCode)
                    .actionUrl("/settings/invoice-template")
                    .guideScreenCode("SCREEN_INVOICE_CONFIG")
                    .guideScreenName("Cấu hình mẫu và ký hiệu hóa đơn điện tử")
                    .suggestedAction("Khai báo ký hiệu và mẫu số hóa đơn để đủ điều kiện phát hành hóa đơn theo quy định Thuế")
                    .build();
        }

        return ContextualGuideResponse.builder()
                .errorCode(errorCode)
                .actionUrl(null)
                .guideScreenCode(null)
                .guideScreenName(null)
                .suggestedAction("Vui lòng kiểm tra lại thao tác hoặc liên hệ hỗ trợ")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ScreenGuideSummaryResponse> getAllGuides(String currentUsername, String search, String targetRole, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<ScreenGuide> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("screenCode")), pattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("screenName")), pattern);
                predicates.add(cb.or(codeMatch, nameMatch));
            }

            if (targetRole != null && !targetRole.trim().isEmpty() && !"ALL".equalsIgnoreCase(targetRole)) {
                predicates.add(cb.equal(root.get("targetRole"), targetRole.trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ScreenGuide> guidePage = screenGuideRepository.findAll(spec, pageable);
        List<ScreenGuide> guides = guidePage.getContent();
        Map<String, Long> stepCountMap;
        if (guides.isEmpty()) {
            stepCountMap = Collections.emptyMap();
        } else {
            List<String> guideIds = guides.stream().map(ScreenGuide::getId).collect(Collectors.toList());
            List<GuideStepCountProjection> stepCounts = screenGuideStepRepository.countStepsByGuideIds(guideIds);
            stepCountMap = stepCounts.stream()
                    .collect(Collectors.toMap(GuideStepCountProjection::getGuideId, GuideStepCountProjection::getStepCount, (c1, c2) -> c1));
        }

        List<ScreenGuideSummaryResponse> content = guides.stream().map(g -> {
            int stepCount = stepCountMap.getOrDefault(g.getId(), 0L).intValue();
            return ScreenGuideSummaryResponse.builder()
                    .id(g.getId())
                    .screenCode(g.getScreenCode())
                    .screenName(g.getScreenName())
                    .actionUrl(g.getActionUrl())
                    .targetRole(g.getTargetRole())
                    .viewCount(g.getViewCount())
                    .isActive(g.getIsActive())
                    .stepCount(stepCount)
                    .updatedAt(g.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.<ScreenGuideSummaryResponse>builder()
                .content(content)
                .pageNumber(guidePage.getNumber())
                .pageSize(guidePage.getSize())
                .totalElements(guidePage.getTotalElements())
                .totalPages(guidePage.getTotalPages())
                .last(guidePage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ScreenGuideResponse createGuide(String currentUsername, CreateScreenGuideRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        checkAdminPermission(user);

        validateSteps(request.getSteps());

        if (screenGuideRepository.existsByScreenCode(request.getScreenCode())) {
            throw new AppException(ErrorCode.SCREEN_GUIDE_CODE_EXISTS);
        }

        ScreenGuide guide = ScreenGuide.builder()
                .screenCode(request.getScreenCode().trim().toUpperCase())
                .screenName(request.getScreenName().trim())
                .description(request.getDescription())
                .actionUrl(request.getActionUrl())
                .targetRole(request.getTargetRole() != null ? request.getTargetRole() : "ALL")
                .viewCount(0L)
                .isActive(true)
                .build();

        ScreenGuide savedGuide = screenGuideRepository.save(guide);

        List<ScreenGuideStep> stepsToSave = request.getSteps().stream().map(s -> ScreenGuideStep.builder()
                .guide(savedGuide)
                .stepNumber(s.getStepNumber())
                .title(s.getTitle().trim())
                .content(s.getContent().trim())
                .targetElementSelector(s.getTargetElementSelector())
                .buttonLabel(s.getButtonLabel())
                .imageUrl(s.getImageUrl())
                .build()).collect(Collectors.toList());

        List<ScreenGuideStep> savedSteps = screenGuideStepRepository.saveAll(stepsToSave);
        log.info("Admin {} created screen guide: {}", currentUsername, savedGuide.getScreenCode());

        return mapToScreenGuideResponse(savedGuide, savedSteps);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ScreenGuideResponse updateGuide(String currentUsername, String id, UpdateScreenGuideRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        checkAdminPermission(user);

        validateSteps(request.getSteps());

        ScreenGuide guide = screenGuideRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SCREEN_GUIDE_NOT_FOUND));

        guide.setScreenName(request.getScreenName().trim());
        guide.setDescription(request.getDescription());
        guide.setActionUrl(request.getActionUrl());
        if (request.getTargetRole() != null) {
            guide.setTargetRole(request.getTargetRole());
        }
        if (request.getIsActive() != null) {
            guide.setIsActive(request.getIsActive());
        }

        screenGuideStepRepository.deleteByGuideId(guide.getId());

        List<ScreenGuideStep> newSteps = request.getSteps().stream().map(s -> ScreenGuideStep.builder()
                .guide(guide)
                .stepNumber(s.getStepNumber())
                .title(s.getTitle().trim())
                .content(s.getContent().trim())
                .targetElementSelector(s.getTargetElementSelector())
                .buttonLabel(s.getButtonLabel())
                .imageUrl(s.getImageUrl())
                .build()).collect(Collectors.toList());

        List<ScreenGuideStep> savedSteps = screenGuideStepRepository.saveAll(newSteps);
        ScreenGuide updatedGuide = screenGuideRepository.save(guide);

        log.info("Admin {} updated screen guide: {}", currentUsername, updatedGuide.getScreenCode());
        return mapToScreenGuideResponse(updatedGuide, savedSteps);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteGuide(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        checkAdminPermission(user);

        ScreenGuide guide = screenGuideRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SCREEN_GUIDE_NOT_FOUND));

        guide.setIsActive(false);
        screenGuideRepository.save(guide);
        log.info("Admin {} deactivated screen guide: {}", currentUsername, guide.getScreenCode());
    }

    private ScreenGuideResponse mapToScreenGuideResponse(ScreenGuide guide, List<ScreenGuideStep> steps) {
        List<ScreenGuideStepResponse> stepResponses = (steps != null ? steps : Collections.<ScreenGuideStep>emptyList())
                .stream().map(s -> ScreenGuideStepResponse.builder()
                        .id(s.getId())
                        .stepNumber(s.getStepNumber())
                        .title(s.getTitle())
                        .content(s.getContent())
                        .targetElementSelector(s.getTargetElementSelector())
                        .buttonLabel(s.getButtonLabel())
                        .imageUrl(s.getImageUrl())
                        .build()).collect(Collectors.toList());

        return ScreenGuideResponse.builder()
                .id(guide.getId())
                .screenCode(guide.getScreenCode())
                .screenName(guide.getScreenName())
                .description(guide.getDescription())
                .actionUrl(guide.getActionUrl())
                .targetRole(guide.getTargetRole())
                .viewCount(guide.getViewCount())
                .isActive(guide.getIsActive())
                .totalSteps(stepResponses.size())
                .steps(stepResponses)
                .updatedAt(guide.getUpdatedAt())
                .build();
    }
}
