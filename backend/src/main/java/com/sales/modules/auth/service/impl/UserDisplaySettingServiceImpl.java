package com.sales.modules.auth.service.impl;
import com.sales.modules.audit.service.impl.ActivityLogHelper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.ButtonSizeLevel;
import com.sales.common.constant.FontSizeLevel;
import com.sales.modules.pos.dto.request.ToggleSimpleModeRequest;
import com.sales.modules.auth.dto.request.UpdateUserDisplaySettingRequest;
import com.sales.modules.pos.dto.response.PosActionItem;
import com.sales.modules.pos.dto.response.PosSimplifiedLayoutResponse;
import com.sales.modules.auth.dto.response.UserDisplaySettingResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.entity.UserDisplaySetting;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.auth.repository.UserDisplaySettingRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.auth.service.UserDisplaySettingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDisplaySettingServiceImpl implements UserDisplaySettingService {

    private final UserDisplaySettingRepository displaySettingRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserDisplaySettingResponse getDisplaySetting(String username) {
        User user = findUserByUsername(username);
        checkUserActive(user);
        UserDisplaySetting setting = getOrCreateDisplaySetting(user);
        return mapToResponse(setting);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDisplaySettingResponse getDisplaySettingForUser(User user) {
        if (user == null) {
            return null;
        }
        return displaySettingRepository.findByUserId(user.getId())
                .map(this::mapToResponse)
                .orElseGet(() -> buildDefaultResponse(user));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserDisplaySettingResponse updateDisplaySetting(String username, UpdateUserDisplaySettingRequest request) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        UserDisplaySetting setting = getOrCreateDisplaySetting(user);

        Map<String, Object> oldValues = new HashMap<>();
        oldValues.put("simpleModeEnabled", setting.getSimpleModeEnabled());
        oldValues.put("fontSizeLevel", setting.getFontSizeLevel() != null ? setting.getFontSizeLevel().name() : null);
        oldValues.put("buttonSizeLevel", setting.getButtonSizeLevel() != null ? setting.getButtonSizeLevel().name() : null);
        oldValues.put("showTextLabels", setting.getShowTextLabels());
        oldValues.put("requireConfirmationDialog", setting.getRequireConfirmationDialog());
        oldValues.put("highContrastEnabled", setting.getHighContrastEnabled());
        oldValues.put("simplifiedPosLayout", setting.getSimplifiedPosLayout());

        setting.setSimpleModeEnabled(Boolean.TRUE.equals(request.getSimpleModeEnabled()));
        setting.setFontSizeLevel(request.getFontSizeLevel() != null ? request.getFontSizeLevel() : FontSizeLevel.STANDARD);
        setting.setButtonSizeLevel(request.getButtonSizeLevel() != null ? request.getButtonSizeLevel() : ButtonSizeLevel.STANDARD);
        setting.setShowTextLabels(Boolean.TRUE.equals(request.getShowTextLabels()));
        setting.setRequireConfirmationDialog(Boolean.TRUE.equals(request.getRequireConfirmationDialog()));
        setting.setHighContrastEnabled(Boolean.TRUE.equals(request.getHighContrastEnabled()));
        setting.setSimplifiedPosLayout(Boolean.TRUE.equals(request.getSimplifiedPosLayout()));

        UserDisplaySetting savedSetting = displaySettingRepository.save(setting);

        Map<String, Object> newValues = new HashMap<>();
        newValues.put("simpleModeEnabled", savedSetting.getSimpleModeEnabled());
        newValues.put("fontSizeLevel", savedSetting.getFontSizeLevel().name());
        newValues.put("buttonSizeLevel", savedSetting.getButtonSizeLevel().name());
        newValues.put("showTextLabels", savedSetting.getShowTextLabels());
        newValues.put("requireConfirmationDialog", savedSetting.getRequireConfirmationDialog());
        newValues.put("highContrastEnabled", savedSetting.getHighContrastEnabled());
        newValues.put("simplifiedPosLayout", savedSetting.getSimplifiedPosLayout());

        logDisplaySettingActivity(user.getHousehold(), user, "UPDATE_DISPLAY_SETTINGS", savedSetting.getId(), oldValues, newValues);

        log.info("Đã cập nhật cấu hình hiển thị cho user: {} (SimpleMode: {}, Font: {}, Button: {})",
                username, savedSetting.getSimpleModeEnabled(), savedSetting.getFontSizeLevel(), savedSetting.getButtonSizeLevel());

        return mapToResponse(savedSetting);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserDisplaySettingResponse toggleSimpleMode(String username, ToggleSimpleModeRequest request) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        UserDisplaySetting setting = getOrCreateDisplaySetting(user);
        boolean targetState = Boolean.TRUE.equals(request.getEnabled());
        boolean oldState = Boolean.TRUE.equals(setting.getSimpleModeEnabled());

        setting.setSimpleModeEnabled(targetState);

        // Khi kích hoạt chế độ chữ lớn & thao tác đơn giản:
        // Tự động nâng cỡ chữ và kích thước nút lên mức LARGE nếu đang ở STANDARD
        if (targetState) {
            if (setting.getFontSizeLevel() == FontSizeLevel.STANDARD) {
                setting.setFontSizeLevel(FontSizeLevel.LARGE);
            }
            if (setting.getButtonSizeLevel() == ButtonSizeLevel.STANDARD) {
                setting.setButtonSizeLevel(ButtonSizeLevel.LARGE);
            }
            setting.setShowTextLabels(true);
            setting.setRequireConfirmationDialog(true);
            setting.setSimplifiedPosLayout(true);
        } else {
            // Khi tắt chế độ chữ lớn: đưa về đúng chuẩn tiêu chuẩn ban đầu
            setting.setFontSizeLevel(FontSizeLevel.STANDARD);
            setting.setButtonSizeLevel(ButtonSizeLevel.STANDARD);
        }

        UserDisplaySetting savedSetting = displaySettingRepository.save(setting);

        logDisplaySettingActivity(user.getHousehold(), user, "TOGGLE_SIMPLE_MODE", savedSetting.getId(),
                Map.of("simpleModeEnabled", oldState),
                Map.of("simpleModeEnabled", targetState,
                        "fontSizeLevel", savedSetting.getFontSizeLevel().name(),
                        "buttonSizeLevel", savedSetting.getButtonSizeLevel().name(),
                        "actionDescription", targetState ? "Bật chế độ chữ lớn và thao tác đơn giản" : "Tắt chế độ chữ lớn"));

        log.info("User {} đã chuyển đổi simple mode sang: {}", username, targetState);

        return mapToResponse(savedSetting);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PosSimplifiedLayoutResponse getSimplifiedPosLayout(String username) {
        User user = findUserByUsername(username);
        checkUserActive(user);
        UserDisplaySetting setting = getOrCreateDisplaySetting(user);

        boolean isSimple = Boolean.TRUE.equals(setting.getSimpleModeEnabled());

        // 4 Thao tác chính cốt lõi (Primary Actions) hiển thị to, rõ
        List<PosActionItem> primaryActions = List.of(
                PosActionItem.builder()
                        .code("SEARCH_PRODUCT")
                        .label("Tìm hàng")
                        .icon("search")
                        .shortcut("F3")
                        .isPrimary(true)
                        .isDestructive(false)
                        .description("Tìm kiếm sản phẩm theo tên hoặc mã hàng")
                        .build(),
                PosActionItem.builder()
                        .code("ADD_PRODUCT")
                        .label("Thêm vào đơn")
                        .icon("plus-circle")
                        .shortcut("Enter")
                        .isPrimary(true)
                        .isDestructive(false)
                        .description("Chọn số lượng và thêm sản phẩm vào đơn đang bán")
                        .build(),
                PosActionItem.builder()
                        .code("CHECKOUT")
                        .label("Thanh toán")
                        .icon("credit-card")
                        .shortcut("F9")
                        .isPrimary(true)
                        .isDestructive(false)
                        .description("Chọn tiền mặt hoặc chuyển khoản để thu tiền")
                        .build(),
                PosActionItem.builder()
                        .code("ISSUE_INVOICE")
                        .label("Xuất hóa đơn")
                        .icon("file-text")
                        .shortcut("F10")
                        .isPrimary(true)
                        .isDestructive(false)
                        .description("Phát hành hóa đơn điện tử cho khách hàng")
                        .build()
        );

        // Các thao tác nâng cao được thu gọn vào mục "Xem thêm"
        List<PosActionItem> moreActions = List.of(
                PosActionItem.builder()
                        .code("SWITCH_PRICE_TIER")
                        .label("Đổi giá sỉ / lẻ")
                        .icon("tag")
                        .shortcut("Alt+P")
                        .isPrimary(false)
                        .isDestructive(false)
                        .description("Chọn bảng giá bán sỉ hoặc giá bán lẻ")
                        .build(),
                PosActionItem.builder()
                        .code("TABLE_MANAGEMENT")
                        .label("Chọn / Đổi bàn")
                        .icon("layout")
                        .shortcut("Alt+T")
                        .isPrimary(false)
                        .isDestructive(false)
                        .description("Quản lý vị trí bàn ăn hoặc khu vực khách ngồi")
                        .build(),
                PosActionItem.builder()
                        .code("APPLY_DISCOUNT")
                        .label("Giảm giá đơn")
                        .icon("percent")
                        .shortcut("Alt+D")
                        .isPrimary(false)
                        .isDestructive(false)
                        .description("Nhập mức chiết khấu theo số tiền hoặc phần trăm")
                        .build(),
                PosActionItem.builder()
                        .code("CREDIT_SALE")
                        .label("Bán ghi nợ")
                        .icon("book-open")
                        .shortcut("Alt+C")
                        .isPrimary(false)
                        .isDestructive(false)
                        .description("Ghi nợ cho khách hàng thân thiết trong hạn mức")
                        .build(),
                PosActionItem.builder()
                        .code("CANCEL_ORDER")
                        .label("Hủy đơn hàng")
                        .icon("trash-2")
                        .shortcut("Esc")
                        .isPrimary(false)
                        .isDestructive(true)
                        .description("Hủy đơn hàng đang tạo kèm bước xác nhận nêu rõ hậu quả")
                        .build()
        );

        FontSizeLevel font = setting.getFontSizeLevel() != null ? setting.getFontSizeLevel() : FontSizeLevel.STANDARD;
        ButtonSizeLevel button = setting.getButtonSizeLevel() != null ? setting.getButtonSizeLevel() : ButtonSizeLevel.STANDARD;

        return PosSimplifiedLayoutResponse.builder()
                .isSimpleMode(isSimple)
                .primaryActions(primaryActions)
                .moreActions(moreActions)
                .fontScaleStyle(font.getBaseFontSize())
                .buttonMinHeightStyle(button.getMinTouchHeight())
                .build();
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkUserActive(User user) {
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }
    }

    private UserDisplaySetting getOrCreateDisplaySetting(User user) {
        return displaySettingRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    log.info("Tự động khởi tạo cấu hình hiển thị mặc định cho user: {}", user.getUsername());
                    UserDisplaySetting defaultSetting = UserDisplaySetting.builder()
                            .user(user)
                            .simpleModeEnabled(false)
                            .fontSizeLevel(FontSizeLevel.STANDARD)
                            .buttonSizeLevel(ButtonSizeLevel.STANDARD)
                            .showTextLabels(true)
                            .requireConfirmationDialog(true)
                            .highContrastEnabled(false)
                            .simplifiedPosLayout(true)
                            .build();
                    return displaySettingRepository.save(defaultSetting);
                });
    }

    private UserDisplaySettingResponse mapToResponse(UserDisplaySetting setting) {
        FontSizeLevel font = setting.getFontSizeLevel() != null ? setting.getFontSizeLevel() : FontSizeLevel.STANDARD;
        ButtonSizeLevel button = setting.getButtonSizeLevel() != null ? setting.getButtonSizeLevel() : ButtonSizeLevel.STANDARD;

        return UserDisplaySettingResponse.builder()
                .id(setting.getId())
                .userId(setting.getUser() != null ? setting.getUser().getId() : null)
                .username(setting.getUser() != null ? setting.getUser().getUsername() : null)
                .simpleModeEnabled(setting.getSimpleModeEnabled())
                .fontSizeLevel(font)
                .fontSizeLevelName(font.getDescription())
                .fontScalePercentage(font.getScalePercentage())
                .buttonSizeLevel(button)
                .buttonSizeLevelName(button.getDescription())
                .buttonScalePercentage(button.getScalePercentage())
                .minTouchHeight(button.getMinTouchHeight())
                .showTextLabels(setting.getShowTextLabels())
                .requireConfirmationDialog(setting.getRequireConfirmationDialog())
                .highContrastEnabled(setting.getHighContrastEnabled())
                .simplifiedPosLayout(setting.getSimplifiedPosLayout())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }

    private UserDisplaySettingResponse buildDefaultResponse(User user) {
        return UserDisplaySettingResponse.builder()
                .id(null)
                .userId(user.getId())
                .username(user.getUsername())
                .simpleModeEnabled(false)
                .fontSizeLevel(FontSizeLevel.STANDARD)
                .fontSizeLevelName(FontSizeLevel.STANDARD.getDescription())
                .fontScalePercentage(FontSizeLevel.STANDARD.getScalePercentage())
                .buttonSizeLevel(ButtonSizeLevel.STANDARD)
                .buttonSizeLevelName(ButtonSizeLevel.STANDARD.getDescription())
                .buttonScalePercentage(ButtonSizeLevel.STANDARD.getScalePercentage())
                .minTouchHeight(ButtonSizeLevel.STANDARD.getMinTouchHeight())
                .showTextLabels(true)
                .requireConfirmationDialog(true)
                .highContrastEnabled(false)
                .simplifiedPosLayout(true)
                .updatedAt(null)
                .build();
    }

    private void logDisplaySettingActivity(BusinessHousehold household, User actor, String action, String targetId,
                                           Map<String, Object> oldValueMap, Map<String, Object> newValueMap) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = null;
            if (request != null) {
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    clientIp = xForwardedFor.split(",")[0].trim();
                } else {
                    clientIp = request.getRemoteAddr();
                }
            }
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldValueJson = oldValueMap != null ? objectMapper.writeValueAsString(oldValueMap) : null;
            String newValueJson = newValueMap != null ? objectMapper.writeValueAsString(newValueMap) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "user_display_settings", targetId, oldValueJson, newValueJson, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for display setting action: {}", action, e);
        }
    }
}
