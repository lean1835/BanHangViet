package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AcceptInvitationRequest;
import com.sales.dto.request.InviteAccountantRequest;
import com.sales.dto.request.RevokeAccountantAssignmentRequest;
import com.sales.dto.response.AccountantAssignmentResponse;
import com.sales.dto.response.AccountantInvitationResponse;
import com.sales.dto.response.AssignedHouseholdResponse;
import com.sales.service.interfaces.AccountantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accountant")
@RequiredArgsConstructor
public class AccountantController {

    private final AccountantService accountantService;

    @PostMapping("/invitations")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<AccountantInvitationResponse>> inviteAccountant(
            Principal principal,
            @Valid @RequestBody InviteAccountantRequest request) {

        AccountantInvitationResponse result = accountantService.inviteAccountant(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<AccountantInvitationResponse>builder()
                .code(1000)
                .message("Gửi lời mời kế toán thuê ngoài thành công")
                .result(result)
                .build());
    }

    @GetMapping("/invitations")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<List<AccountantInvitationResponse>>> getInvitations(Principal principal) {
        List<AccountantInvitationResponse> result = accountantService.getInvitations(principal.getName());
        return ResponseEntity.ok(ApiResponse.<List<AccountantInvitationResponse>>builder()
                .code(1000)
                .message("Lấy danh sách lời mời thành công")
                .result(result)
                .build());
    }

    @PostMapping("/invitations/{token}/accept")
    @PreAuthorize("hasRole('VT-03')")
    public ResponseEntity<ApiResponse<AccountantAssignmentResponse>> acceptInvitation(
            Principal principal,
            @PathVariable String token,
            @RequestBody(required = false) AcceptInvitationRequest request) {

        AccountantAssignmentResponse result = accountantService.acceptInvitation(principal.getName(), token, request);
        return ResponseEntity.ok(ApiResponse.<AccountantAssignmentResponse>builder()
                .code(1000)
                .message("Chấp nhận lời mời kế toán thành công")
                .result(result)
                .build());
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<List<AccountantAssignmentResponse>>> getAssignments(Principal principal) {
        List<AccountantAssignmentResponse> result = accountantService.getAssignments(principal.getName());
        return ResponseEntity.ok(ApiResponse.<List<AccountantAssignmentResponse>>builder()
                .code(1000)
                .message("Lấy danh sách kế toán được phân công thành công")
                .result(result)
                .build());
    }

    @PostMapping("/assignments/{id}/revoke")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> revokeAssignment(
            Principal principal,
            @PathVariable String id,
            @RequestBody(required = false) RevokeAccountantAssignmentRequest request) {

        accountantService.revokeAssignment(principal.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Thu hồi quyền truy cập của kế toán thành công")
                .build());
    }

    @GetMapping("/assigned-households")
    @PreAuthorize("hasRole('VT-03')")
    public ResponseEntity<ApiResponse<List<AssignedHouseholdResponse>>> getAssignedHouseholds(Principal principal) {
        List<AssignedHouseholdResponse> result = accountantService.getAssignedHouseholds(principal.getName());
        return ResponseEntity.ok(ApiResponse.<List<AssignedHouseholdResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hộ kinh doanh được phân công thành công")
                .result(result)
                .build());
    }

    @PostMapping("/switch-household/{householdId}")
    @PreAuthorize("hasRole('VT-03')")
    public ResponseEntity<ApiResponse<AssignedHouseholdResponse>> switchActiveHousehold(
            Principal principal,
            @PathVariable String householdId) {

        AssignedHouseholdResponse result = accountantService.switchActiveHousehold(principal.getName(), householdId);
        return ResponseEntity.ok(ApiResponse.<AssignedHouseholdResponse>builder()
                .code(1000)
                .message("Chuyển đổi hộ kinh doanh làm việc thành công")
                .result(result)
                .build());
    }

    @GetMapping("/my-pending-invitations")
    @PreAuthorize("hasRole('VT-03')")
    public ResponseEntity<ApiResponse<List<AccountantInvitationResponse>>> getMyPendingInvitations(Principal principal) {
        List<AccountantInvitationResponse> result = accountantService.getMyPendingInvitations(principal.getName());
        return ResponseEntity.ok(ApiResponse.<List<AccountantInvitationResponse>>builder()
                .code(1000)
                .message("Lấy danh sách lời mời đang chờ thành công")
                .result(result)
                .build());
    }
}
