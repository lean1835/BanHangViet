package com.sales.modules.support.repository;
import com.sales.common.constant.FaqCategory;
import com.sales.modules.support.entity.FaqItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaqItemRepository extends JpaRepository<FaqItem, String>, JpaSpecificationExecutor<FaqItem> {

    List<FaqItem> findAllByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();

    List<FaqItem> findAllByIsActiveTrueAndCategoryOrderByDisplayOrderAsc(FaqCategory category);

    Optional<FaqItem> findByIdAndIsActiveTrue(String id);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE FaqItem f SET f.viewCount = COALESCE(f.viewCount, 0) + 1 WHERE f.id = :id")
    int incrementViewCount(@Param("id") String id);
}
