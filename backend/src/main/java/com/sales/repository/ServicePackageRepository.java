package com.sales.repository;

import com.sales.entity.ServicePackage;
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
