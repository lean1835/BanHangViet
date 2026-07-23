package com.viet.sales.repository;

import com.viet.sales.entity.PrintSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrintSettingRepository extends JpaRepository<PrintSetting, String> {
    Optional<PrintSetting> findByHouseholdId(String householdId);
}
