package com.sales.modules.support.repository;
import com.sales.modules.support.entity.SupportChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportChannelRepository extends JpaRepository<SupportChannel, String> {

    List<SupportChannel> findAllByIsActiveTrueOrderByDisplayOrderAsc();

    List<SupportChannel> findAllByOrderByDisplayOrderAsc();
}
