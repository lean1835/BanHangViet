package com.sales.service.interfaces;

import com.sales.dto.request.AcceptInvitationRequest;
import com.sales.dto.request.InviteAccountantRequest;
import com.sales.dto.request.RevokeAccountantAssignmentRequest;
import com.sales.dto.response.AccountantAssignmentResponse;
import com.sales.dto.response.AccountantInvitationResponse;
import com.sales.dto.response.AssignedHouseholdResponse;

import java.util.List;

public interface AccountantService {

    AccountantInvitationResponse inviteAccountant(String currentUsername, InviteAccountantRequest request);

    List<AccountantInvitationResponse> getInvitations(String currentUsername);

    AccountantAssignmentResponse acceptInvitation(String currentUsername, String token, AcceptInvitationRequest request);

    List<AccountantAssignmentResponse> getAssignments(String currentUsername);

    void revokeAssignment(String currentUsername, String assignmentId, RevokeAccountantAssignmentRequest request);

    List<AssignedHouseholdResponse> getAssignedHouseholds(String currentUsername);

    AssignedHouseholdResponse switchActiveHousehold(String currentUsername, String householdId);
}
