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
}

