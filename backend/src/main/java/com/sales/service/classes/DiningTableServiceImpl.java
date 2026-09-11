package com.sales.service.classes;

import com.sales.dto.request.CreateDiningTableRequest;
import com.sales.dto.request.UpdateDiningTableRequest;
import com.sales.dto.response.DiningTableResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.DiningTable;
import com.sales.entity.Order;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.DiningTableRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.DiningTableService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiningTableServiceImpl implements DiningTableService {

    private final DiningTableRepository diningTableRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Map<String, ?> newValueMap) {
        try {
            String newStr = (newValueMap != null && objectMapper != null) ? objectMapper.writeValueAsString(newValueMap) : null;
            activityLogHelper.logActivityInNewTransaction(household, actor, action, "dining_tables", targetId, null, newStr, null, null);
        } catch (Exception e) {
            log.warn("Không thể ghi activity log cho dining_tables: {}", e.getMessage());
        }
    }

    private User getAuthenticatedUser(String username) {

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Integer getHouseholdMaxHoldingHours(String householdId) {
        return settingsRepository.findByHouseholdId(householdId)
                .map(BusinessHouseholdSettings::getMaxOrderHoldingHours)
                .orElse(4);
    }

    private DiningTableResponse mapToResponse(DiningTable table, Order currentOrder, Integer maxHoldingHours) {
        boolean isOccupied = currentOrder != null;
        String currentOrderId = null;
        String currentOrderLabel = null;
        Long currentHoldingMinutes = 0L;
        boolean isOverdue = false;

        if (isOccupied) {
            currentOrderId = currentOrder.getId();
            currentOrderLabel = currentOrder.getOrderLabel();
            LocalDateTime createdAt = currentOrder.getCreatedAt() != null ? currentOrder.getCreatedAt() : LocalDateTime.now();
            currentHoldingMinutes = Duration.between(createdAt, LocalDateTime.now()).toMinutes();
            int limitHours = (maxHoldingHours != null && maxHoldingHours > 0) ? maxHoldingHours : 4;
            isOverdue = currentHoldingMinutes >= (limitHours * 60L);
        }

        return DiningTableResponse.builder()
                .id(table.getId())
                .name(table.getName())
                .area(table.getArea())
                .seatCapacity(table.getSeatCapacity())
                .sortOrder(table.getSortOrder())
                .isActive(table.getIsActive())
                .isOccupied(isOccupied)
                .currentOrderId(currentOrderId)
                .currentOrderLabel(currentOrderLabel)
                .currentHoldingMinutes(currentHoldingMinutes)
                .isOverdue(isOverdue)
                .createdAt(table.getCreatedAt())
                .updatedAt(table.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DiningTableResponse> getTables(String currentUsername, String area, Boolean isActive) {
        User user = getAuthenticatedUser(currentUsername);
        String householdId = user.getHousehold().getId();
        Integer maxHoldingHours = getHouseholdMaxHoldingHours(householdId);

        List<DiningTable> tables;
        if (area != null && !area.trim().isEmpty() && isActive != null) {
            tables = diningTableRepository.findByHouseholdIdAndAreaAndIsActiveOrderBySortOrderAscNameAsc(householdId, area.trim(), isActive);
        } else if (area != null && !area.trim().isEmpty()) {
            tables = diningTableRepository.findByHouseholdIdAndAreaOrderBySortOrderAscNameAsc(householdId, area.trim());
        } else if (isActive != null) {
            tables = diningTableRepository.findByHouseholdIdAndIsActiveOrderBySortOrderAscNameAsc(householdId, isActive);
        } else {
            tables = diningTableRepository.findByHouseholdIdOrderBySortOrderAscNameAsc(householdId);
        }

        // Tối ưu hóa N+1: Lấy toàn bộ đơn treo có bàn trong 1 câu query duy nhất
        List<Order> heldOrdersWithTable = orderRepository
                .findByHouseholdIdAndStatusAndDiningTableIsNotNullAndDeletedAtIsNullOrderByCreatedAtDesc(householdId, "CREATING");
        Map<String, Order> tableOrderMap = new HashMap<>();
        for (Order order : heldOrdersWithTable) {
            if (order.getDiningTable() != null && order.getDiningTable().getId() != null) {
                tableOrderMap.putIfAbsent(order.getDiningTable().getId(), order);
            }
        }

        return tables.stream()
                .map(t -> mapToResponse(t, tableOrderMap.get(t.getId()), maxHoldingHours))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DiningTableResponse getTableById(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        String householdId = user.getHousehold().getId();
        DiningTable table = diningTableRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.DINING_TABLE_NOT_FOUND));

        Order currentOrder = orderRepository
                .findFirstByDiningTableIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(table.getId(), "CREATING")
                .orElse(null);

        return mapToResponse(table, currentOrder, getHouseholdMaxHoldingHours(householdId));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DiningTableResponse createTable(String currentUsername, CreateDiningTableRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        String trimmedName = request.getName().trim();
        String trimmedArea = request.getArea() != null && !request.getArea().trim().isEmpty()
                ? request.getArea().trim() : null;

        boolean exists = diningTableRepository.existsByHouseholdIdAndNameAndArea(
                household.getId(), trimmedName, trimmedArea);
        if (exists) {
            throw new AppException(ErrorCode.DINING_TABLE_NAME_DUPLICATED);
        }

        DiningTable table = DiningTable.builder()
                .household(household)
                .name(trimmedName)
                .area(trimmedArea)
                .seatCapacity(request.getSeatCapacity() != null ? request.getSeatCapacity() : 4)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        DiningTable savedTable = diningTableRepository.save(table);

        logActivity(
                household, user, "CREATE_DINING_TABLE",
                savedTable.getId(),
                Map.of("name", savedTable.getName(), "area", savedTable.getArea() != null ? savedTable.getArea() : "")
        );

        return mapToResponse(savedTable, null, getHouseholdMaxHoldingHours(household.getId()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DiningTableResponse updateTable(String currentUsername, String id, UpdateDiningTableRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        DiningTable table = diningTableRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DINING_TABLE_NOT_FOUND));

        String trimmedName = request.getName().trim();
        String trimmedArea = request.getArea() != null && !request.getArea().trim().isEmpty()
                ? request.getArea().trim() : null;

        boolean duplicated = diningTableRepository.existsByHouseholdIdAndNameAndAreaAndIdNot(
                household.getId(), trimmedName, trimmedArea, id);
        if (duplicated) {
            throw new AppException(ErrorCode.DINING_TABLE_NAME_DUPLICATED);
        }

        // Nếu vô hiệu hóa bàn, kiểm tra bàn có đang phục vụ đơn dở dang không
        if (Boolean.FALSE.equals(request.getIsActive()) && Boolean.TRUE.equals(table.getIsActive())) {
            boolean inUse = orderRepository.existsByDiningTableIdAndStatusAndDeletedAtIsNull(id, "CREATING");
            if (inUse) {
                throw new AppException(ErrorCode.DINING_TABLE_IN_USE);
            }
        }

        table.setName(trimmedName);
        table.setArea(trimmedArea);
        if (request.getSeatCapacity() != null) {
            table.setSeatCapacity(request.getSeatCapacity());
        }
        if (request.getSortOrder() != null) {
            table.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            table.setIsActive(request.getIsActive());
        }

        DiningTable savedTable = diningTableRepository.save(table);

        logActivity(
                household, user, "UPDATE_DINING_TABLE",
                savedTable.getId(),
                Map.of("name", savedTable.getName(), "area", savedTable.getArea() != null ? savedTable.getArea() : "")
        );

        Order currentOrder = orderRepository
                .findFirstByDiningTableIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(id, "CREATING")
                .orElse(null);

        return mapToResponse(savedTable, currentOrder, getHouseholdMaxHoldingHours(household.getId()));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteTable(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();

        DiningTable table = diningTableRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DINING_TABLE_NOT_FOUND));

        // Không được xóa bàn nếu đang có đơn dở dang
        boolean inUse = orderRepository.existsByDiningTableIdAndStatusAndDeletedAtIsNull(id, "CREATING");
        if (inUse) {
            throw new AppException(ErrorCode.DINING_TABLE_IN_USE);
        }

        diningTableRepository.delete(table);

        logActivity(
                household, user, "DELETE_DINING_TABLE",
                id,
                Map.of("name", table.getName())
        );
    }
}
