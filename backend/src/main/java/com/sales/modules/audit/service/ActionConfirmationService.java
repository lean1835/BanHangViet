package com.sales.modules.audit.service;
import com.sales.common.constant.ActionType;
import com.sales.modules.audit.dto.response.ActionConsequenceResponse;

public interface ActionConfirmationService {

    ActionConsequenceResponse getActionConsequences(String username, ActionType actionType, String targetId);
}
