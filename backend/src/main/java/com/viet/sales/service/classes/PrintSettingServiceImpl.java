package com.viet.sales.service.classes;

import com.viet.sales.dto.request.PrintSettingRequest;
import com.viet.sales.dto.response.PrintSettingResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.PrintSetting;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.PrintSettingRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.PrintSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrintSettingServiceImpl implements PrintSettingService {

    private final PrintSettingRepository printSettingRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private PrintSetting getOrCreateSetting(BusinessHousehold household) {
        return printSettingRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> {
                    PrintSetting defaultSetting = PrintSetting.builder()
                            .household(household)
                            .paperSize("K80")
                            .printCopies(1)
                            .autoPrint(false)
                            .build();
                    return printSettingRepository.save(defaultSetting);
                });
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PrintSettingResponse getMyPrintSetting(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        PrintSetting setting = getOrCreateSetting(household);
        return mapToResponse(setting);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PrintSettingResponse updateMyPrintSetting(String currentUsername, PrintSettingRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        PrintSetting setting = printSettingRepository.findByHouseholdId(household.getId())
                .orElse(PrintSetting.builder()
                        .household(household)
                        .paperSize("K80")
                        .printCopies(1)
                        .autoPrint(false)
                        .build());

        setting.setPaperSize(request.getPaperSize());
        setting.setPrintCopies(request.getPrintCopies());
        setting.setAutoPrint(request.getAutoPrint());

        PrintSetting saved = printSettingRepository.save(setting);
        log.info("User {} updated print setting for household {}: paperSize={}, copies={}, autoPrint={}",
                currentUsername, household.getId(), saved.getPaperSize(), saved.getPrintCopies(), saved.getAutoPrint());

        return mapToResponse(saved);
    }

    private PrintSettingResponse mapToResponse(PrintSetting setting) {
        return PrintSettingResponse.builder()
                .id(setting.getId())
                .householdId(setting.getHousehold().getId())
                .paperSize(setting.getPaperSize())
                .printCopies(setting.getPrintCopies())
                .autoPrint(setting.getAutoPrint())
                .createdAt(setting.getCreatedAt())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
