package com.sales.service.interfaces;

import java.time.LocalDate;

public interface ReportExportService {
    byte[] exportReportToExcel(String currentUsername, String reportType, LocalDate fromDate, LocalDate toDate, String filter1, String filter2);
}
