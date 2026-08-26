package com.sales.repository;

import com.sales.entity.PosTransferItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PosTransferItemRepository extends JpaRepository<PosTransferItem, String> {

    List<PosTransferItem> findByTransferId(String transferId);
}
