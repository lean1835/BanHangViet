package com.sales.repository;

import com.sales.dto.response.ReturnedQuantityProjection;
import com.sales.entity.ReturnTicketItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnTicketItemRepository extends JpaRepository<ReturnTicketItem, String> {
    List<ReturnTicketItem> findByReturnTicketId(String returnTicketId);

    @Query("SELECT rti.invoiceItemId AS invoiceItemId, " +
           "rti.product.id AS productId, " +
           "rti.productName AS productName, " +
           "SUM(rti.quantity) AS totalReturned " +
           "FROM ReturnTicketItem rti " +
           "WHERE rti.returnTicket.originalInvoice.id = :invoiceId " +
           "AND rti.returnTicket.status IN :statuses " +
           "GROUP BY rti.invoiceItemId, rti.product.id, rti.productName")
    List<ReturnedQuantityProjection> findReturnedQuantitiesByInvoiceId(
            @Param("invoiceId") String invoiceId,
            @Param("statuses") List<String> statuses
    );

    @Query("SELECT rti.product.id AS productId, " +
           "COALESCE(p.name, rti.productName) AS productName, " +
           "p.sku AS sku, " +
           "COALESCE(p.unit, rti.unit) AS unit, " +
           "SUM(rti.quantity) AS totalReturnedQuantity, " +
           "SUM(rti.subtotal) AS totalReturnAmount, " +
           "COUNT(DISTINCT rti.returnTicket.id) AS ticketCount " +
           "FROM ReturnTicketItem rti " +
           "LEFT JOIN rti.product p " +
           "WHERE rti.returnTicket.household.id = :householdId " +
           "AND rti.returnTicket.status = 'APPROVED' " +
           "AND (COALESCE(rti.returnTicket.approvedAt, rti.returnTicket.createdAt) BETWEEN :startDateTime AND :endDateTime) " +
           "GROUP BY rti.product.id, COALESCE(p.name, rti.productName), p.sku, COALESCE(p.unit, rti.unit) " +
           "ORDER BY SUM(rti.quantity) DESC, SUM(rti.subtotal) DESC")
    List<com.sales.dto.response.TopReturnedProductProjection> findTopReturnedProducts(
            @Param("householdId") String householdId,
            @Param("startDateTime") java.time.LocalDateTime startDateTime,
            @Param("endDateTime") java.time.LocalDateTime endDateTime,
            org.springframework.data.domain.Pageable pageable
    );
}

