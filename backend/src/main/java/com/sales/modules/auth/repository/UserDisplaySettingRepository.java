package com.sales.modules.auth.repository;
import com.sales.modules.auth.entity.UserDisplaySetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserDisplaySettingRepository extends JpaRepository<UserDisplaySetting, String> {

    Optional<UserDisplaySetting> findByUserId(String userId);

    boolean existsByUserId(String userId);
}
