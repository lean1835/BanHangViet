package com.sales.repository;

import com.sales.entity.SupplierReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SupplierReturnItemRepository extends JpaRepository<SupplierReturnItem, String> {

    @Query("SELECT COALESCE(SUM(sri.quantity), 0) FROM SupplierReturnItem sri " +
           "WHERE sri.receiptDetail.id = :receiptDetailId AND sri.supplierReturn.deletedAt IS NULL")
    BigDecimal sumQuantityReturnedByReceiptDetailId(@Param("receiptDetailId") String receiptDetailId);

    @Query("SELECT COALESCE(SUM(sri.baseQuantity), 0) FROM SupplierReturnItem sri " +
           "WHERE sri.receiptDetail.id = :receiptDetailId AND sri.supplierReturn.deletedAt IS NULL")
    BigDecimal sumBaseQuantityReturnedByReceiptDetailId(@Param("receiptDetailId") String receiptDetailId);

    interface ReceiptDetailReturnedProjection {
        String getDetailId();
        BigDecimal getTotalReturned();
    }

    @Query("SELECT sri.receiptDetail.id AS detailId, COALESCE(SUM(sri.quantity), 0) AS totalReturned " +
           "FROM SupplierReturnItem sri " +
           "WHERE sri.receiptDetail.id IN :detailIds AND sri.supplierReturn.deletedAt IS NULL " +
           "GROUP BY sri.receiptDetail.id")
    List<ReceiptDetailReturnedProjection> sumQuantityReturnedByDetailIds(@Param("detailIds") List<String> detailIds);

    @Query("SELECT COALESCE(SUM(sri.baseQuantity), 0) FROM SupplierReturnItem sri " +
           "WHERE sri.product.id = :productId AND sri.supplierReturn.household.id = :householdId " +
           "AND sri.supplierReturn.returnDate < :dateTime AND sri.supplierReturn.deletedAt IS NULL")
    BigDecimal sumQuantityBefore(@Param("productId") String productId,
                                 @Param("householdId") String householdId,
                                 @Param("dateTime") LocalDateTime dateTime);

    @Query("SELECT sri FROM SupplierReturnItem sri " +
           "JOIN FETCH sri.supplierReturn sr " +
           "JOIN FETCH sri.product p " +
           "WHERE p.id = :productId AND sr.household.id = :householdId " +
           "AND sr.returnDate BETWEEN :startDateTime AND :endDateTime " +
           "AND sr.deletedAt IS NULL " +
           "ORDER BY sr.returnDate ASC")
    List<SupplierReturnItem> findStockMovementsByProductInPeriod(
            @Param("productId") String productId,
            @Param("householdId") String householdId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    @Query("""
        SELECT sri.product.id, COALESCE(SUM(sri.baseQuantity), 0)
        FROM SupplierReturnItem sri
        WHERE sri.supplierReturn.household.id = :householdId
          AND sri.supplierReturn.returnDate <= :dateTime
          AND sri.supplierReturn.deletedAt IS NULL
        GROUP BY sri.product.id
    """)
    List<Object[]> sumQuantityBeforeGroupedByProduct(
            @Param("householdId") String householdId,
            @Param("dateTime") LocalDateTime dateTime
    );
}
