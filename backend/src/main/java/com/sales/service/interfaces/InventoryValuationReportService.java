package com.sales.service.interfaces;

import com.sales.dto.response.InventoryValuationReportResponse;

import java.time.LocalDate;

public interface InventoryValuationReportService {

    /**
     * Tra cứu báo cáo giá trị tồn kho theo giá vốn (NCL-13-CN-007).
     *
     * @param currentUsername Tên đăng nhập người dùng thực hiện
     * @param asOfDate        Ngày chốt số liệu (null = thời gian thực hiện tại)
     * @param groupId         Lọc theo nhóm hàng (null = toàn bộ)
     * @param search          Từ khóa tìm kiếm theo tên hoặc SKU
     * @param sortBy          Trường sắp xếp (mặc định inventoryValue)
     * @param sortDir         Chiều sắp xếp (mặc định desc)
     * @return Dữ liệu báo cáo giá trị tồn kho
     */
    InventoryValuationReportResponse getInventoryValuationReport(
            String currentUsername,
            LocalDate asOfDate,
            String groupId,
            String search,
            String sortBy,
            String sortDir
    );

    /**
     * Xuất báo cáo giá trị tồn kho ra tệp bảng tính Excel (.xlsx).
     *
     * @param currentUsername Tên đăng nhập người dùng thực hiện
     * @param asOfDate        Ngày chốt số liệu
     * @param groupId         Lọc theo nhóm hàng
     * @param search          Từ khóa tìm kiếm
     * @return Mảng byte của tệp Excel .xlsx
     */
    byte[] exportInventoryValuationExcel(
            String currentUsername,
            LocalDate asOfDate,
            String groupId,
            String search
    );
}
