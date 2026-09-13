package com.sales.service.classes;

import com.sales.constant.IncidentStatus;
import com.sales.constant.PlatformLogSeverity;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PlatformIncidentResponse;
import com.sales.dto.response.PlatformSystemLogResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PlatformIncident;
import com.sales.entity.PlatformSystemLog;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.PlatformIncidentRepository;
import com.sales.repository.PlatformSystemLogRepository;
import com.sales.service.interfaces.PlatformSystemLogService;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformSystemLogServiceImpl implements PlatformSystemLogService {

    private final PlatformSystemLogRepository logRepository;
    private final PlatformIncidentRepository incidentRepository;
    private final BusinessHouseholdRepository householdRepository;

    private PlatformSystemLogResponse mapToResponse(PlatformSystemLog logEntity) {
        return PlatformSystemLogResponse.builder()
                .id(logEntity.getId())
                .eventType(logEntity.getEventType())
                .severity(logEntity.getSeverity())
                .householdId(logEntity.getHousehold() != null ? logEntity.getHousehold().getId() : null)
                .householdTaxCode(logEntity.getHousehold() != null ? logEntity.getHousehold().getTaxCode() : null)
                .errorCode(logEntity.getErrorCode())
                .technicalMessage(logEntity.getMessage())
                .technicalMetadata(logEntity.getMetadata())
                .isWidespreadIncident(logEntity.getIsWidespreadIncident())
                .incidentId(logEntity.getIncident() != null ? logEntity.getIncident().getId() : null)
                .createdAt(logEntity.getCreatedAt())
                .build();
    }

    private PlatformIncidentResponse mapIncidentToResponse(PlatformIncident inc) {
        return PlatformIncidentResponse.builder()
                .id(inc.getId())
                .title(inc.getTitle())
                .eventType(inc.getEventType())
                .severity(inc.getSeverity())
                .status(inc.getStatus())
                .affectedHouseholdsCount(inc.getAffectedHouseholdsCount())
                .errorThresholdCount(inc.getErrorThresholdCount())
                .description(inc.getDescription())
                .startedAt(inc.getStartedAt())
                .resolvedAt(inc.getResolvedAt())
                .createdAt(inc.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public PlatformSystemLog logSystemEvent(
            String eventType,
            PlatformLogSeverity severity,
            String householdId,
            String errorCode,
            String technicalMessage,
            String metadataJson) {

        BusinessHousehold household = null;
        if (householdId != null && !householdId.trim().isEmpty()) {
            household = householdRepository.findById(householdId).orElse(null);
        }

        PlatformSystemLog sysLog = PlatformSystemLog.builder()
                .eventType(eventType)
                .severity(severity)
                .household(household)
                .errorCode(errorCode)
                .message(technicalMessage)
                .metadata(metadataJson)
                .isWidespreadIncident(false)
                .build();

        sysLog = logRepository.save(sysLog);

        // TC-02: Nhận diện sự cố diện rộng khi lỗi vượt ngưỡng trong 10 phút
        if (severity == PlatformLogSeverity.ERROR || severity == PlatformLogSeverity.CRITICAL) {
            LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
            long recentErrorsCount = logRepository.countByEventTypeAndCreatedAtAfter(eventType, tenMinutesAgo);
            long distinctHouseholds = logRepository.countDistinctHouseholdsByEventTypeAndCreatedAtAfter(eventType, tenMinutesAgo);

            if (recentErrorsCount >= 5 || distinctHouseholds >= 3) {
                sysLog.setIsWidespreadIncident(true);

                // Tìm incident đang mở của eventType này hoặc tạo mới
                PlatformIncident incident = incidentRepository
                        .findFirstByEventTypeAndStatusNot(eventType, IncidentStatus.RESOLVED)
                        .orElseGet(() -> {
                            PlatformIncident newInc = PlatformIncident.builder()
                                    .title("Sự cố diện rộng: " + eventType)
                                    .eventType(eventType)
                                    .severity(severity)
                                    .status(IncidentStatus.INVESTIGATING)
                                    .affectedHouseholdsCount((int) distinctHouseholds)
                                    .errorThresholdCount(5)
                                    .description("Phát hiện " + recentErrorsCount + " lỗi " + eventType + " xảy ra trên " + distinctHouseholds + " hộ kinh doanh trong vòng 10 phút.")
                                    .startedAt(LocalDateTime.now())
                                    .build();
                            return incidentRepository.save(newInc);
                        });

                incident.setAffectedHouseholdsCount((int) Math.max(incident.getAffectedHouseholdsCount(), distinctHouseholds));
                incidentRepository.save(incident);

                sysLog.setIncident(incident);
                sysLog = logRepository.save(sysLog);
                log.error("WIDESPREAD INCIDENT DETECTED for {}: {} errors across {} households",
                        eventType, recentErrorsCount, distinctHouseholds);
            }
        }

        return sysLog;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PlatformSystemLogResponse> getPlatformLogs(
            String currentUsername,
            String severityStr,
            LocalDate fromDate,
            LocalDate toDate,
            String householdId,
            String eventType,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<PlatformSystemLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (severityStr != null && !severityStr.trim().isEmpty() && !"ALL".equalsIgnoreCase(severityStr)) {
                try {
                    PlatformLogSeverity sev = PlatformLogSeverity.valueOf(severityStr.toUpperCase());
                    predicates.add(cb.equal(root.get("severity"), sev));
                } catch (IllegalArgumentException ignored) {}
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate.atTime(LocalTime.MAX)));
            }

            if (householdId != null && !householdId.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("household").get("id"), householdId));
            }

            if (eventType != null && !eventType.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("eventType"), eventType.trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<PlatformSystemLog> logPage = logRepository.findAll(spec, pageable);

        List<PlatformSystemLogResponse> items = logPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<PlatformSystemLogResponse>builder()
                .content(items)
                .pageNumber(logPage.getNumber())
                .pageSize(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .last(logPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformSystemLogResponse getLogDetail(String currentUsername, String logId) {
        PlatformSystemLog sysLog = logRepository.findById(logId)
                .orElseThrow(() -> new AppException(ErrorCode.PLATFORM_LOG_NOT_FOUND));

        return mapToResponse(sysLog);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlatformIncidentResponse> getIncidents(String currentUsername) {
        return incidentRepository.findAllByOrderByStartedAtDesc().stream()
                .map(this::mapIncidentToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PlatformIncidentResponse resolveIncident(String currentUsername, String incidentId) {
        PlatformIncident inc = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new AppException(ErrorCode.PLATFORM_INCIDENT_NOT_FOUND));

        inc.setStatus(IncidentStatus.RESOLVED);
        inc.setResolvedAt(LocalDateTime.now());
        inc = incidentRepository.save(inc);

        return mapIncidentToResponse(inc);
    }
}
