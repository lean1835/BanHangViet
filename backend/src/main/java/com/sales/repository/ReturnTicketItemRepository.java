package com.sales.repository;

import com.sales.entity.ReturnTicketItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnTicketItemRepository extends JpaRepository<ReturnTicketItem, String> {
    List<ReturnTicketItem> findByReturnTicketId(String returnTicketId);
}
