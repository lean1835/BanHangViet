package com.sales.modules.supplier.service.impl;
import com.sales.common.constant.DebtType;
import com.sales.modules.product.dto.response.ImportPreviewResponse;
import com.sales.modules.supplier.dto.response.ImportSupplierResultResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.supplier.entity.Supplier;
import com.sales.modules.supplier.entity.SupplierDebt;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.supplier.repository.SupplierDebtRepository;
import com.sales.modules.supplier.repository.SupplierRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
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
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplierImportServiceImplTest {

    @Mock
    private SupplierRepository supplierRepository;
    @Mock
    private SupplierDebtRepository supplierDebtRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityLogHelper activityLogHelper;

    @InjectMocks
    private SupplierImportServiceImpl supplierImportService;

    private User ownerUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Cửa Hàng Bách Hóa Việt")
                .taxCode("0123456789")
                .build();

        ownerUser = User.builder()
                .id("u-1")
                .username("owner1")
                .role(ownerRole)
                .household(household)
                .build();
    }

    private MockMultipartFile createSupplierExcelFile(List<String[]> dataRows) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("NhaCungCap");
            Row header = sheet.createRow(0);
            String[] headers = {"Tên NCC", "Số điện thoại", "Mã số thuế", "Email", "Địa chỉ", "Số dư nợ đầu kỳ", "Ghi chú"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }

            int rIdx = 1;
            for (String[] r : dataRows) {
                Row row = sheet.createRow(rIdx++);
                for (int c = 0; c < r.length; c++) {
                    if (r[c] != null) {
                        row.createCell(c).setCellValue(r[c]);
                    }
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new MockMultipartFile("file", "suppliers.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        }
    }

    @Test
    @DisplayName("NCL-09-CN-009 (Supplier): Tệp rỗng ném ngoại lệ EMPTY_IMPORT_FILE")
    void testImportSuppliers_EmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.xlsx", "application/octet-stream", new byte[0]);
        AppException ex = assertThrows(AppException.class, () -> supplierImportService.importSuppliers("owner1", emptyFile, "SKIP"));
        assertEquals(ErrorCode.EMPTY_IMPORT_FILE, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-09-CN-009 (Supplier): Tệp hợp lệ -> Tạo NCC thành công và ghi nhận DEBT_CREATED có vết [IMPORT_EXCEL]")
    void testImportSuppliers_ValidDataSuccess() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());
        when(supplierRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Supplier> list = inv.getArgument(0);
            for (Supplier s : list) {
                s.setId("sup-generated-1");
            }
            return list;
        });

        List<String[]> rows = Collections.singletonList(
                new String[]{"Công ty TNHH Bia Nước Ngọt", "0987654321", "0102030405", "sales@bia.vn", "Hà Nội", "25000000", "Đại lý cấp 1"}
        );
        MockMultipartFile file = createSupplierExcelFile(rows);

        ImportSupplierResultResponse response = supplierImportService.importSuppliers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());

        verify(supplierRepository, times(1)).saveAll(anyList());
        verify(supplierDebtRepository, times(1)).saveAll(argThat(debts -> {
            List<SupplierDebt> list = (List<SupplierDebt>) debts;
            return list.size() == 1
                    && DebtType.DEBT_CREATED.equals(list.get(0).getType())
                    && list.get(0).getAmount().compareTo(new BigDecimal("25000000")) == 0
                    && list.get(0).getNotes().contains("[IMPORT_EXCEL]");
        }));
    }

    @Test
    @DisplayName("NCL-09-CN-009 (Supplier): Xem trước phát hiện trùng SĐT NCC -> Báo số lượng trùng lặp")
    void testPreviewImportSuppliers_DuplicatePhoneDetected() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        Supplier existing = Supplier.builder().id("sup-old").name("NCC Cũ").phoneNumber("0987654321").build();
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(List.of(existing));

        List<String[]> rows = Collections.singletonList(
                new String[]{"NCC Mới Cùng Số", "0987654321", "", "", "", "0", ""}
        );
        MockMultipartFile file = createSupplierExcelFile(rows);

        ImportPreviewResponse preview = supplierImportService.previewImport("owner1", file);

        assertNotNull(preview);
        assertEquals(1, preview.getTotalRows());
        assertEquals(1, preview.getDuplicateCount());
        assertEquals(0, preview.getValidCount());
    }

    @Test
    @DisplayName("NCL-09-CN-009 (Supplier): SĐT cố định (02x) hợp lệ -> Tạo NCC thành công")
    void testImportSuppliers_LandlinePhoneSuccess() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());
        when(supplierRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<String[]> rows = Collections.singletonList(
                new String[]{"Công ty Cổ phần Bao Bì Hà Nội", "02431234567", "0109998888", "info@baobi.vn", "Hà Nội", "0", "NCC vật tư"}
        );
        MockMultipartFile file = createSupplierExcelFile(rows);

        ImportSupplierResultResponse response = supplierImportService.importSuppliers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
    }

    @Test
    @DisplayName("P1-2 (Supplier): SĐT nhà cung cấp lưu numeric trong Excel -> Tự động bù 0 thành công")
    void testImportSuppliers_NumericCellPhone_AutoPaddedZero() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());
        when(supplierRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("NhaCungCap");
            Row header = sheet.createRow(0);
            String[] headers = {"Tên nhà cung cấp", "Số điện thoại", "Mã số thuế", "Email", "Địa chỉ", "Số dư nợ đầu kỳ", "Ghi chú"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("NCC Phụ Tùng");
            row.createCell(1).setCellValue(987654321.0); // Numeric cell!

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            MockMultipartFile file = new MockMultipartFile("file", "suppliers.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());

            ImportSupplierResultResponse response = supplierImportService.importSuppliers("owner1", file, "SKIP");

            assertNotNull(response);
            assertEquals(1, response.getTotalRows());
            assertEquals(1, response.getSuccessCount());
            assertEquals(0, response.getErrorCount());

            verify(supplierRepository, times(1)).saveAll(argThat(suppliers -> {
                List<Supplier> list = (List<Supplier>) suppliers;
                return list.size() == 1 && "0987654321".equals(list.get(0).getPhoneNumber());
            }));
        }
    }

    @Test
    @DisplayName("P2-3 (Supplier): Tệp không đúng định dạng .xlsx/.xls -> Ném ngoại lệ INVALID_FILE_FORMAT")
    void testImportSuppliers_InvalidFileFormat() {
        MockMultipartFile badFile = new MockMultipartFile("file", "suppliers.zip", "application/zip", new byte[]{1, 2, 3});
        AppException ex = assertThrows(AppException.class, () -> supplierImportService.importSuppliers("owner1", badFile, "SKIP"));
        assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
    }

    @Test
    @DisplayName("P2-1 (Supplier): NCC hiện có SĐT format quốc tế (+84...) -> Khớp trùng lặp chính xác nhờ chuẩn hóa cleanPhone")
    void testImportSuppliers_ExistingPhoneWithCountryCode_MatchesDuplicate() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        Supplier existing = Supplier.builder().id("s-old").name("NCC Cũ").phoneNumber("+84987654321").build();
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(List.of(existing));

        List<String[]> rows = Collections.singletonList(
                new String[]{"NCC Cũ Nhập Lại", "0987654321", "", "", "", "0", ""}
        );
        MockMultipartFile file = createSupplierExcelFile(rows);

        ImportSupplierResultResponse response = supplierImportService.importSuppliers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getSkippedCount());
        assertEquals(0, response.getErrorCount());
    }
}
