package com.sales.modules.audit.repository;
import com.sales.modules.audit.entity.UserNotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserNotificationSettingRepository extends JpaRepository<UserNotificationSetting, String> {

    List<UserNotificationSetting> findByUserId(String userId);

    Optional<UserNotificationSetting> findByUserIdAndNotificationType(String userId, String notificationType);

    @Query("SELECT s.notificationType FROM UserNotificationSetting s WHERE s.user.id = :userId AND s.isEnabled = false")
    Set<String> findDisabledTypesByUserId(@Param("userId") String userId);
}
