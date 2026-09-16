package com.sales.service.interfaces;

import com.sales.constant.ActionType;
import com.sales.dto.response.ActionConsequenceResponse;

public interface ActionConfirmationService {

    ActionConsequenceResponse getActionConsequences(String username, ActionType actionType, String targetId);
}
