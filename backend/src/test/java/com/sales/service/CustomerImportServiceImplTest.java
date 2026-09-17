package com.sales.service;

import com.sales.constant.DebtType;

import com.sales.dto.response.ImportCustomerResultResponse;
import com.sales.dto.response.ImportPreviewResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.CustomerDebtRepository;
import com.sales.repository.CustomerRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.CustomerImportServiceImpl;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerImportServiceImplTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerDebtRepository customerDebtRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityLogHelper activityLogHelper;

    @InjectMocks
    private CustomerImportServiceImpl customerImportService;

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

    private MockMultipartFile createExcelFile(List<String[]> dataRows) throws Exception {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("KhachHang");
            Row header = sheet.createRow(0);
            String[] headers = {"Tên khách hàng", "Số điện thoại", "Mã số thuế", "Email", "Địa chỉ", "Hạn mức nợ", "Số dư nợ đầu kỳ", "Kênh nhận"};
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
            return new MockMultipartFile("file", "customers.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());
        }
    }

    @Test
    @DisplayName("NCL-09-CN-009-TC-01: Tệp rỗng ném ngoại lệ EMPTY_IMPORT_FILE")
    void testImportCustomers_EmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.xlsx", "application/octet-stream", new byte[0]);
        AppException ex = assertThrows(AppException.class, () -> customerImportService.importCustomers("owner1", emptyFile, "SKIP"));
        assertEquals(ErrorCode.EMPTY_IMPORT_FILE, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-09-CN-009-TC-02: Tệp đúng mẫu và dữ liệu hợp lệ -> Nhập khách hàng thành công và tạo khoản DEBT_CREATED")
    void testImportCustomers_ValidDataSuccess() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());
        when(customerRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<Customer> list = inv.getArgument(0);
            for (Customer c : list) {
                c.setId("cust-generated-1");
            }
            return list;
        });

        List<String[]> rows = Collections.singletonList(
                new String[]{"Nguyễn Văn An", "0912345678", "0312345678", "an@gmail.com", "Hà Nội", "5000000", "1500000", "QR"}
        );
        MockMultipartFile file = createExcelFile(rows);

        ImportCustomerResultResponse response = customerImportService.importCustomers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());

        verify(customerRepository, times(1)).saveAll(anyList());
        verify(customerDebtRepository, times(1)).saveAll(argThat(debts -> {
            List<CustomerDebt> list = (List<CustomerDebt>) debts;
            return list.size() == 1
                    && DebtType.DEBT_CREATED.equals(list.get(0).getType())
                    && list.get(0).getAmount().compareTo(new BigDecimal("1500000")) == 0
                    && list.get(0).getNotes().contains("[IMPORT_EXCEL]");
        }));
    }

    @Test
    @DisplayName("NCL-09-CN-009-TC-03: Xem trước phát hiện trùng lặp SĐT -> Báo số lượng trùng lặp")
    void testPreviewImport_DuplicatePhoneDetected() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        Customer existing = Customer.builder().id("cust-old").name("Nguyễn Văn Cũ").phoneNumber("0912345678").build();
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(List.of(existing));

        List<String[]> rows = Collections.singletonList(
                new String[]{"Nguyễn Văn An Mới", "0912345678", "", "", "", "0", "0", "QR"}
        );
        MockMultipartFile file = createExcelFile(rows);

        ImportPreviewResponse preview = customerImportService.previewImport("owner1", file);

        assertNotNull(preview);
        assertEquals(1, preview.getTotalRows());
        assertEquals(1, preview.getDuplicateCount());
        assertEquals(0, preview.getValidCount());
        assertEquals("0912345678", preview.getDuplicates().get(0).getIdentifier());
    }

    @Test
    @DisplayName("NCL-09-CN-009-TC-04: Dòng sai số điện thoại -> Bỏ qua dòng lỗi và ghi nhận lý do")
    void testImportCustomers_InvalidPhoneError() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());

        List<String[]> rows = Collections.singletonList(
                new String[]{"Trần Thị B", "12345", "", "", "", "0", "0", "QR"} // SĐT sai định dạng
        );
        MockMultipartFile file = createExcelFile(rows);

        ImportCustomerResultResponse response = customerImportService.importCustomers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getErrorCount());
        assertEquals("Số điện thoại không đúng định dạng Việt Nam", response.getErrors().get(0).getReason());
        assertNotNull(response.getErrorFileBase64());
    }

    @Test
    @DisplayName("P1-2: SĐT khách hàng lưu numeric trong Excel (mất số 0 thành 9 chữ số) -> Tự động bù 0 thành công")
    void testImportCustomers_NumericCellPhone_AutoPaddedZero() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());
        when(customerRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("KhachHang");
            Row header = sheet.createRow(0);
            String[] headers = {"Tên khách hàng", "Số điện thoại", "Mã số thuế", "Email", "Địa chỉ", "Hạn mức nợ", "Số dư nợ đầu kỳ", "Kênh nhận"};
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
            }
            Row row = sheet.createRow(1);
            row.createCell(0).setCellValue("Khách Hàng Numeric");
            row.createCell(1).setCellValue(912345678.0); // Numeric trong Excel!

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            MockMultipartFile file = new MockMultipartFile("file", "customers.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", out.toByteArray());

            ImportCustomerResultResponse response = customerImportService.importCustomers("owner1", file, "SKIP");

            assertNotNull(response);
            assertEquals(1, response.getTotalRows());
            assertEquals(1, response.getSuccessCount());
            assertEquals(0, response.getErrorCount());

            verify(customerRepository, times(1)).saveAll(argThat(customers -> {
                List<Customer> list = (List<Customer>) customers;
                return list.size() == 1 && "0912345678".equals(list.get(0).getPhoneNumber());
            }));
        }
    }

    @Test
    @DisplayName("P2-2: Khách hàng dùng số cố định (02x) 11 số -> Import thành công")
    void testImportCustomers_LandlinePhoneSuccess() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(Collections.emptyList());
        when(customerRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<String[]> rows = Collections.singletonList(
                new String[]{"Công ty Khách Hàng", "02431234567", "0109998888", "khach@cty.vn", "Hà Nội", "0", "0", "ZALO"}
        );
        MockMultipartFile file = createExcelFile(rows);

        ImportCustomerResultResponse response = customerImportService.importCustomers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
    }

    @Test
    @DisplayName("P2-3: Tải tệp không đúng định dạng .xlsx/.xls -> Ném ngoại lệ INVALID_FILE_FORMAT")
    void testImportCustomers_InvalidFileFormat() {
        MockMultipartFile badFile = new MockMultipartFile("file", "data.csv", "text/csv", "col1,col2\nval1,val2".getBytes());
        AppException ex = assertThrows(AppException.class, () -> customerImportService.importCustomers("owner1", badFile, "SKIP"));
        assertEquals(ErrorCode.INVALID_FILE_FORMAT, ex.getErrorCode());
    }

    @Test
    @DisplayName("P2-1: Khách hàng hiện có SĐT format quốc tế (+84...) -> Khớp trùng lặp chính xác nhờ chuẩn hóa cleanPhone")
    void testImportCustomers_ExistingPhoneWithCountryCode_MatchesDuplicate() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        Customer existing = Customer.builder().id("c-old").name("Khách Cũ").phoneNumber("+84912345678").build();
        when(customerRepository.findAllByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(List.of(existing));

        List<String[]> rows = Collections.singletonList(
                new String[]{"Khách Cũ Nhập Lại", "0912345678", "", "", "", "0", "0", "QR"}
        );
        MockMultipartFile file = createExcelFile(rows);

        ImportCustomerResultResponse response = customerImportService.importCustomers("owner1", file, "SKIP");

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getSkippedCount());
        assertEquals(0, response.getErrorCount());
    }
}
