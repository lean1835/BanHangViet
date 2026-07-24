package com.viet.sales.service;

import com.viet.sales.dto.response.ImportProductResultResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ProductGroupRepository;
import com.viet.sales.repository.ProductRepository;
import com.viet.sales.repository.TaxRateRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.ProductImportServiceImpl;
import com.viet.sales.utils.ExcelParserUtils;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductImportServiceImplTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductGroupRepository productGroupRepository;

    @Mock
    private TaxRateRepository taxRateRepository;

    @InjectMocks
    private ProductImportServiceImpl productImportService;

    private User ownerUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Hộ Kinh Doanh Mẫu")
                .build();

        ownerUser = User.builder()
                .id("user-001")
                .username("owner")
                .role(ownerRole)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("NCL-09-CN-005-TC-04: Tệp rỗng ném ngoại lệ EMPTY_IMPORT_FILE")
    void importProducts_EmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);

        AppException exception = assertThrows(AppException.class, () ->
                productImportService.importProducts("owner", emptyFile)
        );

        assertEquals(ErrorCode.EMPTY_IMPORT_FILE, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-09-CN-005-TC-01: Tệp đúng mẫu và dữ liệu hợp lệ -> Nhập sản phẩm thành công")
    void importProducts_ValidExcel_Success() throws Exception {
        com.viet.sales.entity.TaxRate sampleTax = com.viet.sales.entity.TaxRate.builder()
                .id("tax-001")
                .name("Thuế 1%")
                .ratePercentage(new java.math.BigDecimal("1.00"))
                .isActive(true)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.findByHouseholdIdAndIsActiveTrueOrderByCreatedAtAsc("house-001")).thenReturn(Collections.singletonList(sampleTax));
        when(productRepository.findSkusByHouseholdId("house-001")).thenReturn(Collections.emptyList());

        byte[] excelBytes;
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã SKU");
            header.createCell(1).setCellValue("Tên hàng hóa");
            header.createCell(2).setCellValue("Đơn vị tính");
            header.createCell(4).setCellValue("Giá bán");
            header.createCell(5).setCellValue("% Thuế suất");

            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("SP001");
            dataRow.createCell(1).setCellValue("Cà phê Rang Xay");
            dataRow.createCell(2).setCellValue("Gói");
            dataRow.createCell(4).setCellValue(120000);
            dataRow.createCell(5).setCellValue(1);

            workbook.write(out);
            excelBytes = out.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        ImportProductResultResponse response = productImportService.importProducts("owner", file);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
        verify(productRepository, times(1)).saveAll(any());
    }

    @Test
    @DisplayName("NCL-09-CN-005-TC-02 & TC-03: Trùng SKU hoặc dữ liệu lỗi -> Bỏ qua dòng lỗi và ghi chi tiết")
    void importProducts_WithErrors_RecordsRowDetails() throws Exception {
        com.viet.sales.entity.TaxRate sampleTax = com.viet.sales.entity.TaxRate.builder()
                .id("tax-001")
                .name("Thuế 1%")
                .ratePercentage(new java.math.BigDecimal("1.00"))
                .isActive(true)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.findByHouseholdIdAndIsActiveTrueOrderByCreatedAtAsc("house-001")).thenReturn(Collections.singletonList(sampleTax));
        when(productRepository.findSkusByHouseholdId("house-001")).thenReturn(Collections.singletonList("SP_EXISTING"));

        byte[] excelBytes;
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã SKU");
            header.createCell(1).setCellValue("Tên hàng hóa");
            header.createCell(2).setCellValue("Đơn vị tính");
            header.createCell(4).setCellValue("Giá bán");

            // Row 1: Valid
            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue("SP001");
            r1.createCell(1).setCellValue("Trà Chanh");
            r1.createCell(2).setCellValue("Ly");
            r1.createCell(4).setCellValue(20000);

            // Row 2: Duplicate SKU in DB
            Row r2 = sheet.createRow(2);
            r2.createCell(0).setCellValue("SP_EXISTING");
            r2.createCell(1).setCellValue("Cà phê Đen");
            r2.createCell(2).setCellValue("Ly");
            r2.createCell(4).setCellValue(25000);

            // Row 3: Missing Name
            Row r3 = sheet.createRow(3);
            r3.createCell(0).setCellValue("SP003");
            r3.createCell(1).setCellValue(""); // Missing name
            r3.createCell(2).setCellValue("Cái");
            r3.createCell(4).setCellValue(50000);

            workbook.write(out);
            excelBytes = out.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        ImportProductResultResponse response = productImportService.importProducts("owner", file);

        assertNotNull(response);
        assertEquals(3, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(2, response.getErrorCount());
        assertEquals(2, response.getErrors().size());
    }

    @Test
    @DisplayName("NCL-09-CN-005-TC-05: Giá nhập âm -> Báo lỗi dòng chi tiết")
    void importProducts_NegativeCostPrice_RecordsError() throws Exception {
        com.viet.sales.entity.TaxRate sampleTax = com.viet.sales.entity.TaxRate.builder()
                .id("tax-001")
                .name("Thuế 1%")
                .ratePercentage(new java.math.BigDecimal("1.00"))
                .isActive(true)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.findByHouseholdIdAndIsActiveTrueOrderByCreatedAtAsc("house-001")).thenReturn(Collections.singletonList(sampleTax));
        when(productRepository.findSkusByHouseholdId("house-001")).thenReturn(Collections.emptyList());

        byte[] excelBytes;
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã SKU");
            header.createCell(1).setCellValue("Tên hàng hóa");
            header.createCell(2).setCellValue("Đơn vị tính");
            header.createCell(3).setCellValue("Giá nhập");
            header.createCell(4).setCellValue("Giá bán");

            Row r1 = sheet.createRow(1);
            r1.createCell(0).setCellValue("SP001");
            r1.createCell(1).setCellValue("Trà Chanh");
            r1.createCell(2).setCellValue("Ly");
            r1.createCell(3).setCellValue(-5000); // Negative cost price
            r1.createCell(4).setCellValue(20000);

            workbook.write(out);
            excelBytes = out.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        ImportProductResultResponse response = productImportService.importProducts("owner", file);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getErrorCount());
        assertTrue(response.getErrors().get(0).getErrorMessage().contains("Giá nhập không được là số âm"));
    }

    @Test
    @DisplayName("NCL-09-FIX-P1-01: Thuế suất dạng % thập phân (0.08) -> Khớp đúng mức thuế 8.00%")
    void importProducts_PercentageFormattedTaxRate_Success() throws Exception {
        com.viet.sales.entity.TaxRate sampleTax8Percent = com.viet.sales.entity.TaxRate.builder()
                .id("tax-008")
                .name("Thuế 8%")
                .ratePercentage(new java.math.BigDecimal("8.00"))
                .isActive(true)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.findByHouseholdIdAndIsActiveTrueOrderByCreatedAtAsc("house-001")).thenReturn(Collections.singletonList(sampleTax8Percent));
        when(productRepository.findSkusByHouseholdId("house-001")).thenReturn(Collections.emptyList());

        byte[] excelBytes;
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã SKU");
            header.createCell(1).setCellValue("Tên hàng hóa");
            header.createCell(2).setCellValue("Đơn vị tính");
            header.createCell(4).setCellValue("Giá bán");
            header.createCell(5).setCellValue("% Thuế suất");

            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("SP008");
            dataRow.createCell(1).setCellValue("Bánh ngọt 8%");
            dataRow.createCell(2).setCellValue("Cái");
            dataRow.createCell(4).setCellValue(50000);
            dataRow.createCell(5).setCellValue("0.08"); // POI percentage read value

            workbook.write(out);
            excelBytes = out.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        ImportProductResultResponse response = productImportService.importProducts("owner", file);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
    }

    @Test
    @DisplayName("NCL-09-FIX-P1-02: Dòng rỗng chỉ có style (getFirstCellNum == -1) -> Bỏ qua không văng ngoại lệ")
    void importProducts_EmptyStyledRow_SkippedWithoutCrash() throws Exception {
        com.viet.sales.entity.TaxRate sampleTax = com.viet.sales.entity.TaxRate.builder()
                .id("tax-001")
                .name("Thuế 1%")
                .ratePercentage(new java.math.BigDecimal("1.00"))
                .isActive(true)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(taxRateRepository.findByHouseholdIdAndIsActiveTrueOrderByCreatedAtAsc("house-001")).thenReturn(Collections.singletonList(sampleTax));
        when(productRepository.findSkusByHouseholdId("house-001")).thenReturn(Collections.emptyList());

        byte[] excelBytes;
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet();
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Mã SKU");
            header.createCell(1).setCellValue("Tên hàng hóa");
            header.createCell(2).setCellValue("Đơn vị tính");
            header.createCell(4).setCellValue("Giá bán");

            Row validRow = sheet.createRow(1);
            validRow.createCell(0).setCellValue("SP001");
            validRow.createCell(1).setCellValue("Sản phẩm 1");
            validRow.createCell(2).setCellValue("Hộp");
            validRow.createCell(4).setCellValue(10000);

            // Empty row (no cells created at all)
            sheet.createRow(2);

            workbook.write(out);
            excelBytes = out.toByteArray();
        }

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBytes);

        ImportProductResultResponse response = assertDoesNotThrow(() ->
                productImportService.importProducts("owner", file)
        );

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
    }

    @Test
    @DisplayName("NCL-09-FIX-P1-03: User chưa có Role (role == null) -> Ném ngoại lệ FORBIDDEN thay vì NPE")
    void importProducts_NullRoleUser_ThrowsForbidden() {
        User userWithoutRole = User.builder()
                .id("user-norole")
                .username("norole")
                .role(null)
                .household(household)
                .build();

        when(userRepository.findByUsername("norole")).thenReturn(Optional.of(userWithoutRole));

        MockMultipartFile file = new MockMultipartFile("file", "products.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[]{1, 2, 3});

        AppException exception = assertThrows(AppException.class, () ->
                productImportService.importProducts("norole", file)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }
}


