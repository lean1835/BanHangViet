package com.sales.repository;

import com.sales.entity.ProductExchangeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductExchangeItemRepository extends JpaRepository<ProductExchangeItem, String> {

    List<ProductExchangeItem> findByExchangeTicketId(String exchangeTicketId);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM ProductExchangeItem i " +
           "WHERE i.exchangeTicket.originalInvoice.id = :originalInvoiceId " +
           "AND i.product.id = :productId " +
           "AND i.itemType = 'RETURN_ITEM' " +
           "AND i.exchangeTicket.status = 'COMPLETED'")
    BigDecimal sumReturnedQuantityByInvoiceAndProduct(
            @Param("originalInvoiceId") String originalInvoiceId,
            @Param("productId") String productId);

    @Query("SELECT COUNT(i) > 0 FROM ProductExchangeItem i " +
           "WHERE i.product.id = :productId " +
           "AND i.exchangeTicket.household.id = :householdId")
    boolean hasStockMovementByProduct(
            @Param("productId") String productId,
            @Param("householdId") String householdId);

    @Query("SELECT COALESCE(SUM(i.quantity), 0) FROM ProductExchangeItem i " +
           "WHERE i.product.id = :productId " +
           "AND i.exchangeTicket.household.id = :householdId " +
           "AND i.itemType = :itemType " +
           "AND i.exchangeTicket.status = 'COMPLETED' " +
           "AND i.exchangeTicket.createdAt < :beforeTime")
    BigDecimal sumQuantityBefore(
            @Param("productId") String productId,
            @Param("householdId") String householdId,
            @Param("itemType") String itemType,
            @Param("beforeTime") LocalDateTime beforeTime);

    @Query("SELECT i FROM ProductExchangeItem i " +
           "WHERE i.product.id = :productId " +
           "AND i.exchangeTicket.household.id = :householdId " +
           "AND i.exchangeTicket.status = 'COMPLETED' " +
           "AND i.exchangeTicket.createdAt >= :startTime " +
           "AND i.exchangeTicket.createdAt <= :endTime")
    List<ProductExchangeItem> findStockMovementsByProductInPeriod(
            @Param("productId") String productId,
            @Param("householdId") String householdId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
