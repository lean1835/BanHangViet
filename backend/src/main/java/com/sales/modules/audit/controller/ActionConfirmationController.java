package com.sales.modules.audit.controller;
import com.sales.common.constant.ActionType;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.audit.dto.response.ActionConsequenceResponse;
import com.sales.modules.audit.service.ActionConfirmationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/action-confirmations")
@RequiredArgsConstructor
@Tag(name = "Action Confirmation Controller", description = "Cung cấp cảnh báo và phân tích trước hậu quả đối với các thao tác một chiều không thể hoàn tác (NCL-19-CN-001)")
public class ActionConfirmationController {
    private final ActionConfirmationService actionConfirmationService;

    @Operation(summary = "Phân tích trước hậu quả thao tác một chiều", description = "Kiểm tra thực tế trạng thái đơn hàng, hóa đơn thuế... và trả về danh sách cảnh báo hậu quả chi tiết cho người dùng")
    @GetMapping("/consequences")
    public ResponseEntity<ApiResponse<ActionConsequenceResponse>> getActionConsequences(
            Principal principal,
            @RequestParam ActionType actionType,
            @RequestParam String targetId) {
        ActionConsequenceResponse result = actionConfirmationService.getActionConsequences(
                principal.getName(), actionType, targetId);
        ApiResponse<ActionConsequenceResponse> response = ApiResponse.<ActionConsequenceResponse>builder()
                .code(1000)
                .message("Phân tích hậu quả thao tác thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
