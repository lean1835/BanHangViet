package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.UpdateSessionSettingsRequest;
import com.sales.modules.auth.dto.response.SessionSettingsResponse;
import com.sales.modules.auth.dto.response.UserSessionResponse;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.entity.UserSession;

import java.util.List;

public interface UserSessionService {

    UserSession createSession(User user, String clientIp, String userAgent);

    boolean validateSession(String sessionId);

    List<UserSessionResponse> getSessions(String currentUsername);

    void revokeSession(String sessionId, String reason, String currentUsername);

    void revokeAllSessionsForUser(String targetUserId, String reason, String currentUsername);

    void revokeAllSessionsExcept(String userId, String currentSessionId, String reason, User actor);

    SessionSettingsResponse getSessionSettings(String currentUsername);

    SessionSettingsResponse updateSessionSettings(String currentUsername, UpdateSessionSettingsRequest request);
}
