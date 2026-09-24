package com.sales.modules.platform.repository;
import com.sales.modules.platform.entity.ServicePackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServicePackageRepository extends JpaRepository<ServicePackage, String> {

    Optional<ServicePackage> findByCode(String code);

    boolean existsByCode(String code);

    List<ServicePackage> findByIsActiveTrueOrderByPriceAsc();
}
