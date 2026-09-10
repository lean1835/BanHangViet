package com.sales.service.interfaces;

import com.sales.dto.request.CreateDiningTableRequest;
import com.sales.dto.request.UpdateDiningTableRequest;
import com.sales.dto.response.DiningTableResponse;

import java.util.List;

public interface DiningTableService {

    List<DiningTableResponse> getTables(String currentUsername, String area, Boolean isActive);

    DiningTableResponse getTableById(String currentUsername, String id);

    DiningTableResponse createTable(String currentUsername, CreateDiningTableRequest request);

    DiningTableResponse updateTable(String currentUsername, String id, UpdateDiningTableRequest request);

    void deleteTable(String currentUsername, String id);
}
