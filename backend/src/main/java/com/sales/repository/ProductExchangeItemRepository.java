package com.sales.repository;

import com.sales.entity.ProductExchangeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
}
