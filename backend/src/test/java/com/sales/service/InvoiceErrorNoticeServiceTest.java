package com.sales.service;

import com.sales.dto.request.CreateInvoiceErrorNoticeRequest;
import com.sales.dto.request.InvoiceErrorNoticeItemRequest;
import com.sales.dto.response.InvoiceErrorNoticeResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.EInvoice;
import com.sales.entity.InvoiceErrorNotice;
import com.sales.entity.InvoiceErrorNoticeItem;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceErrorNoticeItemRepository;
import com.sales.repository.InvoiceErrorNoticeRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.InvoiceErrorNoticeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceErrorNoticeServiceTest {

    @Mock
    private InvoiceErrorNoticeRepository noticeRepository;

    @Mock
    private InvoiceErrorNoticeItemRepository noticeItemRepository;

    @Mock
    private EInvoiceRepository invoiceRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InvoiceErrorNoticeServiceImpl noticeService;

    private User ketoanUser;
    private BusinessHousehold household;
    private EInvoice canceledInvoice;
    private EInvoice adjustedInvoice;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Kinh Doanh Bà Năm")
                .taxCode("8123456789")
                .address("123 Lê Lợi, Q1")
                .phoneNumber("0901234567")
                .build();

        Role roleKetoan = Role.builder().id(3).code("VT-03").name("Kế toán").build();

        ketoanUser = User.builder()
                .id("user-1")
                .username("ketoan01")
                .fullName("Kế Toán Viên")
                .household(household)
                .role(roleKetoan)
                .build();

        canceledInvoice = EInvoice.builder()
                .id("inv-canceled")
                .household(household)
                .invoiceNumber("00000100")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .status("CANCELED")
                .isErrorNotified(false)
                .finalAmount(new BigDecimal("100000"))
                .lookupCode("LOOKUP100")
                .createdByUser(ketoanUser)
                .createdAt(LocalDateTime.now())
                .build();

        adjustedInvoice = EInvoice.builder()
                .id("inv-adjusted")
                .household(household)
                .invoiceNumber("00000101")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .status("ADJUSTED")
                .isErrorNotified(false)
                .finalAmount(new BigDecimal("200000"))
                .lookupCode("LOOKUP101")
                .createdByUser(ketoanUser)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("NCL-05-CN-005: Lấy danh sách hóa đơn đủ điều kiện lập thông báo sai sót không bị N+1 query")
    void testGetEligibleInvoicesForNotice_Success() {
        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(invoiceRepository.findEligibleForErrorNotice("hh-1"))
                .thenReturn(List.of(canceledInvoice, adjustedInvoice));

        List<InvoiceResponse> result = noticeService.getEligibleInvoicesForNotice("ketoan01");

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(invoiceRepository, times(1)).findEligibleForErrorNotice("hh-1");
        verify(noticeRepository, never()).isInvoiceInAcceptedNotice(anyString());
    }

    @Test
    @DisplayName("NCL-05-CN-005-TC-01: Lập thông báo sai sót Mẫu 04/SS-HĐĐT thành công")
    void testCreateErrorNotice_Success() {
        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-canceled", "hh-1"))
                .thenReturn(Optional.of(canceledInvoice));
        when(noticeRepository.isInvoiceInAcceptedNotice("inv-canceled")).thenReturn(false);
        when(noticeRepository.save(any(InvoiceErrorNotice.class))).thenAnswer(i -> {
            InvoiceErrorNotice n = i.getArgument(0);
            n.setId("notice-1");
            return n;
        });

        CreateInvoiceErrorNoticeRequest req = CreateInvoiceErrorNoticeRequest.builder()
                .noticePlace("TP. Hồ Chí Minh")
                .items(List.of(
                        InvoiceErrorNoticeItemRequest.builder()
                                .invoiceId("inv-canceled")
                                .handlingType("CANCEL")
                                .reason("Hủy do nhầm thông tin khách hàng")
                                .build()
                ))
                .build();

        InvoiceErrorNoticeResponse response = noticeService.createErrorNotice("ketoan01", req);

        assertNotNull(response);
        assertEquals("DRAFT", response.getStatus());
        assertEquals("04/SS", response.getNoticeType());
        assertEquals(1, response.getItems().size());
        assertEquals("CANCEL", response.getItems().get(0).getHandlingType());
    }

    @Test
    @DisplayName("NCL-05-CN-005-TC-02: Chặn lập thông báo cho hóa đơn đã thuộc thông báo CQT tiếp nhận")
    void testCreateErrorNotice_AlreadyAccepted_ThrowsException() {
        canceledInvoice.setIsErrorNotified(true);
        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-canceled", "hh-1"))
                .thenReturn(Optional.of(canceledInvoice));

        CreateInvoiceErrorNoticeRequest req = CreateInvoiceErrorNoticeRequest.builder()
                .items(List.of(
                        InvoiceErrorNoticeItemRequest.builder()
                                .invoiceId("inv-canceled")
                                .handlingType("CANCEL")
                                .reason("Lập lại")
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () -> noticeService.createErrorNotice("ketoan01", req));
        assertEquals(ErrorCode.INVOICE_ALREADY_NOTICE_ACCEPTED, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-05-CN-005-TC-01: Gửi thông báo sai sót tới CQT mô phỏng thành công & đánh dấu liên kết 2 chiều")
    void testSendNoticeToTaxAuthority_Success() {
        InvoiceErrorNotice draftNotice = InvoiceErrorNotice.builder()
                .id("notice-1")
                .household(household)
                .noticeCode("04SS-20260909")
                .status("DRAFT")
                .createdByUser(ketoanUser)
                .items(List.of(
                        InvoiceErrorNoticeItem.builder()
                                .id("item-1")
                                .invoice(canceledInvoice)
                                .handlingType("CANCEL")
                                .reason("Hủy")
                                .build()
                ))
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(noticeRepository.findByIdAndHouseholdId("notice-1", "hh-1")).thenReturn(Optional.of(draftNotice));
        when(noticeRepository.save(any(InvoiceErrorNotice.class))).thenAnswer(i -> i.getArgument(0));

        InvoiceErrorNoticeResponse response = noticeService.sendNoticeToTaxAuthority("ketoan01", "notice-1");

        assertNotNull(response);
        assertEquals("ACCEPTED", response.getStatus());
        assertNotNull(response.getTaxAuthorityCode());
        assertTrue(canceledInvoice.getIsErrorNotified());
        verify(invoiceRepository, times(1)).save(canceledInvoice);
    }

    @Test
    @DisplayName("NCL-05-CN-005-TC-03: CQT mô phỏng từ chối thông báo -> Đưa về nháp để kế toán sửa và gửi lại")
    void testTaxAuthorityRejectNotice_AndReopenDraft_TC03() {
        InvoiceErrorNotice notice = InvoiceErrorNotice.builder()
                .id("notice-1")
                .household(household)
                .noticeCode("04SS-20260909")
                .status("WAITING_TAX_RESPONSE")
                .createdByUser(ketoanUser)
                .items(new ArrayList<>(List.of(
                        InvoiceErrorNoticeItem.builder()
                                .id("item-1")
                                .invoice(canceledInvoice)
                                .handlingType("CANCEL")
                                .reason("Hủy sai thông tin")
                                .build()
                )))
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(noticeRepository.findByIdAndHouseholdId("notice-1", "hh-1")).thenReturn(Optional.of(notice));
        when(noticeRepository.save(any(InvoiceErrorNotice.class))).thenAnswer(i -> i.getArgument(0));

        // Step 1: CQT từ chối
        InvoiceErrorNoticeResponse rejectedResponse = noticeService.rejectNoticeByTaxAuthority("ketoan01", "notice-1", "Sai sót hình thức xử lý");
        assertNotNull(rejectedResponse);
        assertEquals("REJECTED", rejectedResponse.getStatus());
        assertEquals("Sai sót hình thức xử lý", rejectedResponse.getTaxAuthorityResponse());

        // Step 2: Kế toán đưa thông báo về nháp
        InvoiceErrorNoticeResponse reopenedResponse = noticeService.reopenNoticeToDraft("ketoan01", "notice-1");
        assertNotNull(reopenedResponse);
        assertEquals("DRAFT", reopenedResponse.getStatus());

        // Step 3: Kế toán sửa thông tin / lý do
        when(invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-canceled", "hh-1"))
                .thenReturn(Optional.of(canceledInvoice));
        when(noticeRepository.isInvoiceInAcceptedNotice("inv-canceled")).thenReturn(false);

        CreateInvoiceErrorNoticeRequest updateReq = CreateInvoiceErrorNoticeRequest.builder()
                .noticePlace("TP. Hồ Chí Minh")
                .items(List.of(
                        InvoiceErrorNoticeItemRequest.builder()
                                .invoiceId("inv-canceled")
                                .handlingType("CANCEL")
                                .reason("Hủy do khách hàng đổi ý")
                                .build()
                ))
                .build();

        InvoiceErrorNoticeResponse updatedResponse = noticeService.updateErrorNotice("ketoan01", "notice-1", updateReq);
        assertEquals("DRAFT", updatedResponse.getStatus());
        assertEquals("Hủy do khách hàng đổi ý", updatedResponse.getItems().get(0).getReason());

        // Step 4: Gửi lại thông báo sau khi sửa -> Thành công ACCEPTED
        InvoiceErrorNoticeResponse resentResponse = noticeService.sendNoticeToTaxAuthority("ketoan01", "notice-1");
        assertEquals("ACCEPTED", resentResponse.getStatus());
        assertTrue(canceledInvoice.getIsErrorNotified());
    }

    @Test
    @DisplayName("P1-01: CQT từ chối thông báo đã ACCEPTED -> Bị chặn với lỗi ERROR_NOTICE_CANNOT_REJECT")
    void testTaxAuthorityRejectNotice_AlreadyAccepted_ThrowsException() {
        InvoiceErrorNotice acceptedNotice = InvoiceErrorNotice.builder()
                .id("notice-accepted")
                .household(household)
                .noticeCode("04SS-20260909")
                .status("ACCEPTED")
                .createdByUser(ketoanUser)
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(noticeRepository.findByIdAndHouseholdId("notice-accepted", "hh-1")).thenReturn(Optional.of(acceptedNotice));

        AppException ex = assertThrows(AppException.class, () ->
                noticeService.rejectNoticeByTaxAuthority("ketoan01", "notice-accepted", "Lý do sai lệch"));

        assertEquals(ErrorCode.ERROR_NOTICE_CANNOT_REJECT, ex.getErrorCode());
        verify(noticeRepository, never()).save(any());
    }

    @Test
    @DisplayName("P1-02: Tạo thông báo sai sót có invoiceId trùng lặp trong request -> Bị chặn với DUPLICATE_INVOICE_IN_NOTICE")
    void testCreateErrorNotice_DuplicateInvoices_ThrowsException() {
        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));

        CreateInvoiceErrorNoticeRequest request = CreateInvoiceErrorNoticeRequest.builder()
                .items(List.of(
                        InvoiceErrorNoticeItemRequest.builder().invoiceId("inv-canceled").handlingType("CANCEL").reason("Lý do 1").build(),
                        InvoiceErrorNoticeItemRequest.builder().invoiceId("inv-canceled").handlingType("CANCEL").reason("Lý do 2").build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                noticeService.createErrorNotice("ketoan01", request));

        assertEquals(ErrorCode.DUPLICATE_INVOICE_IN_NOTICE, ex.getErrorCode());
        verify(noticeRepository, never()).save(any());
    }

    @Test
    @DisplayName("P1-02: Cập nhật thông báo sai sót có invoiceId trùng lặp -> Bị chặn với DUPLICATE_INVOICE_IN_NOTICE")
    void testUpdateErrorNotice_DuplicateInvoices_ThrowsException() {
        InvoiceErrorNotice draftNotice = InvoiceErrorNotice.builder()
                .id("notice-draft")
                .household(household)
                .noticeCode("04SS-20260909")
                .status("DRAFT")
                .createdByUser(ketoanUser)
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(ketoanUser));
        when(noticeRepository.findByIdAndHouseholdId("notice-draft", "hh-1")).thenReturn(Optional.of(draftNotice));

        CreateInvoiceErrorNoticeRequest request = CreateInvoiceErrorNoticeRequest.builder()
                .items(List.of(
                        InvoiceErrorNoticeItemRequest.builder().invoiceId("inv-canceled").handlingType("CANCEL").reason("Lý do 1").build(),
                        InvoiceErrorNoticeItemRequest.builder().invoiceId("inv-canceled").handlingType("CANCEL").reason("Lý do 2").build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                noticeService.updateErrorNotice("ketoan01", "notice-draft", request));

        assertEquals(ErrorCode.DUPLICATE_INVOICE_IN_NOTICE, ex.getErrorCode());
        verify(noticeRepository, never()).save(any());
    }
}
