package com.sales.modules.pos.service;
import com.sales.common.constant.PosTransferStatus;
import com.sales.modules.pos.dto.request.CancelPosTransferRequest;
import com.sales.modules.pos.dto.request.CreatePosTransferRequest;
import com.sales.modules.pos.dto.response.PosTransferResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface PosTransferService {

    PosTransferResponse createTransfer(String currentUsername, CreatePosTransferRequest request);

    Page<PosTransferResponse> getTransfers(
            String currentUsername,
            String fromPosId,
            String toPosId,
            PosTransferStatus status,
            String keyword,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable);

    PosTransferResponse getTransferById(String currentUsername, String transferId);

    PosTransferResponse receiveTransfer(String currentUsername, String transferId);

    PosTransferResponse cancelTransfer(String currentUsername, String transferId, CancelPosTransferRequest request);
}
