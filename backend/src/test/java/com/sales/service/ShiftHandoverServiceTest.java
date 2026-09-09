package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.ShiftHandoverRequest;
import com.sales.dto.response.ShiftHandoverResponse;
import com.sales.dto.response.ShiftHandoverSummaryResponse;
import com.sales.dto.response.ShiftStagesSummaryResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.Shift;
import com.sales.entity.ShiftHandover;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.OrderRepository;
import com.sales.repository.ShiftHandoverRepository;
import com.sales.repository.ShiftRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.ShiftHandoverServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ShiftHandoverServiceTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private ShiftHandoverRepository shiftHandoverRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private com.sales.repository.CashTransactionRepository cashTransactionRepository;

    @InjectMocks
    private ShiftHandoverServiceImpl shiftHandoverService;

    private BusinessHousehold household;
    private Role cashierRole;
    private User sender;
    private User receiver;
    private Shift activeShift;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-1")
                .name("Tiệm Tạp Hóa Việt")
                .build();

        cashierRole = Role.builder()
                .id(2)
                .code("VT-02")
                .name("Nhân viên bán hàng")
                .build();

        sender = User.builder()
                .id("user-sender")
                .username("sender_cashier")
                .fullName("Nguyễn Văn Sender")
                .passwordHash("hashed_sender_pwd")
                .role(cashierRole)
                .household(household)
                .isActive(true)
                .build();

        receiver = User.builder()
                .id("user-receiver")
                .username("receiver_cashier")
                .fullName("Trần Thị Receiver")
                .passwordHash("hashed_receiver_pwd")
                .role(cashierRole)
                .household(household)
                .isActive(true)
                .build();

        activeShift = Shift.builder()
                .id("shift-1")
                .household(household)
                .user(sender)
                .status(ShiftStatus.OPEN)
                .openedAt(LocalDateTime.now().minusHours(4))
                .openingCash(new BigDecimal("1000000.00"))
                .build();

        lenient().when(shiftRepository.findByIdWithLock(anyString())).thenReturn(Optional.of(activeShift));
    }

    @Test
    @DisplayName("TC-01: Bàn giao ca thành công không có chênh lệch tiền")
    void performShiftHandover_Success_NoDifference() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(shiftRepository.existsByUserIdAndStatus(receiver.getId(), ShiftStatus.OPEN)).thenReturn(false);
        when(passwordEncoder.matches("raw_pwd", receiver.getPasswordHash())).thenReturn(true);
        when(shiftHandoverRepository.findTopByShiftIdOrderByStageNumberDesc(activeShift.getId())).thenReturn(Optional.empty());

        when(orderRepository.sumCollectedAmountByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any()))
                .thenReturn(new BigDecimal("500000.00"));
        when(orderRepository.countCompletedOrdersByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any())).thenReturn(10);
        when(orderRepository.countByShiftIdAndStatusAndDeletedAtIsNull(activeShift.getId(), "CREATING")).thenReturn(2);

        when(shiftHandoverRepository.save(any(ShiftHandover.class))).thenAnswer(invocation -> {
            ShiftHandover ho = invocation.getArgument(0);
            ho.setId("handover-1");
            return ho;
        });
        when(shiftRepository.save(any(Shift.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("raw_pwd")
                .actualCash(new BigDecimal("1500000.00")) // 1000k + 500k = 1500k
                .differenceReason(null)
                .notes("Bàn giao bình thường")
                .build();

        ShiftHandoverResponse response = shiftHandoverService.performShiftHandover(sender.getUsername(), request);

        assertNotNull(response);
        assertEquals("handover-1", response.getId());
        assertEquals(1, response.getStageNumber());
        assertEquals(new BigDecimal("1000000.00"), response.getOpeningCash());
        assertEquals(new BigDecimal("500000.00"), response.getCashRevenue());
        assertEquals(new BigDecimal("1500000.00"), response.getExpectedCash());
        assertEquals(new BigDecimal("1500000.00"), response.getActualCash());
        assertEquals(BigDecimal.ZERO.setScale(2), response.getDifferenceAmount());
        assertEquals(receiver.getId(), activeShift.getUser().getId()); // Ca đã đổi sang cho receiver
    }

    @Test
    @DisplayName("TC-02: Chặn bàn giao khi người nhận đang có một ca khác đang mở (QTN-15)")
    void performShiftHandover_RecipientAlreadyHasOpenShift_ThrowsException() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(shiftRepository.existsByUserIdAndStatus(receiver.getId(), ShiftStatus.OPEN)).thenReturn(true);

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("raw_pwd")
                .actualCash(new BigDecimal("1500000.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.RECIPIENT_ALREADY_HAS_OPEN_SHIFT, ex.getErrorCode());
        verify(shiftHandoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-03: Lệch tiền nhưng thiếu lý do chênh lệch -> ném HANDOVER_DIFFERENCE_REASON_REQUIRED")
    void performShiftHandover_DiscrepancyWithoutReason_ThrowsException() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(shiftRepository.existsByUserIdAndStatus(receiver.getId(), ShiftStatus.OPEN)).thenReturn(false);
        when(passwordEncoder.matches("raw_pwd", receiver.getPasswordHash())).thenReturn(true);
        when(shiftHandoverRepository.findTopByShiftIdOrderByStageNumberDesc(activeShift.getId())).thenReturn(Optional.empty());

        when(orderRepository.sumCollectedAmountByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any()))
                .thenReturn(new BigDecimal("500000.00")); // Quỹ dự kiến 1500k

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("raw_pwd")
                .actualCash(new BigDecimal("1450000.00")) // Thiếu 50k
                .differenceReason(null) // Không có lý do
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.HANDOVER_DIFFERENCE_REASON_REQUIRED, ex.getErrorCode());
        verify(shiftHandoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-04: Lệch tiền có lý do hợp lệ -> Gán chênh lệch cho người bàn giao")
    void performShiftHandover_DiscrepancyWithReason_Success() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(shiftRepository.existsByUserIdAndStatus(receiver.getId(), ShiftStatus.OPEN)).thenReturn(false);
        when(passwordEncoder.matches("raw_pwd", receiver.getPasswordHash())).thenReturn(true);
        when(shiftHandoverRepository.findTopByShiftIdOrderByStageNumberDesc(activeShift.getId())).thenReturn(Optional.empty());

        when(orderRepository.sumCollectedAmountByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any()))
                .thenReturn(new BigDecimal("500000.00"));
        when(orderRepository.countCompletedOrdersByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any())).thenReturn(5);
        when(orderRepository.countByShiftIdAndStatusAndDeletedAtIsNull(activeShift.getId(), "CREATING")).thenReturn(1);

        when(shiftHandoverRepository.save(any(ShiftHandover.class))).thenAnswer(invocation -> {
            ShiftHandover ho = invocation.getArgument(0);
            ho.setId("handover-diff");
            return ho;
        });
        when(shiftRepository.save(any(Shift.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("raw_pwd")
                .actualCash(new BigDecimal("1450000.00")) // Thiếu 50k
                .differenceReason("Làm rơi mất tiền thối 50k")
                .notes("Đã ghi nhận")
                .build();

        ShiftHandoverResponse response = shiftHandoverService.performShiftHandover(sender.getUsername(), request);

        assertNotNull(response);
        assertEquals(new BigDecimal("-50000.00"), response.getDifferenceAmount());
        assertEquals("Làm rơi mất tiền thối 50k", response.getDifferenceReason());
        assertEquals(sender.getId(), response.getSenderUserId());
    }

    @Test
    @DisplayName("TC-05: Sai mật khẩu người nhận -> ném RECIPIENT_AUTHENTICATION_FAILED")
    void performShiftHandover_WrongPassword_ThrowsException() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(shiftRepository.existsByUserIdAndStatus(receiver.getId(), ShiftStatus.OPEN)).thenReturn(false);
        when(passwordEncoder.matches("wrong_pwd", receiver.getPasswordHash())).thenReturn(false);

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("wrong_pwd")
                .actualCash(new BigDecimal("1500000.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.RECIPIENT_AUTHENTICATION_FAILED, ex.getErrorCode());
        verify(shiftHandoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-06: Bàn giao ca cho chính mình -> ném CANNOT_HANDOVER_TO_SELF")
    void performShiftHandover_ToSelf_ThrowsException() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(sender.getId()) // Chính mình
                .recipientPassword("pwd")
                .actualCash(new BigDecimal("1000000.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.CANNOT_HANDOVER_TO_SELF, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-08: Lấy tóm tắt chốt tạm chặng (Summary API)")
    void getHandoverSummary_Success() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(shiftHandoverRepository.findTopByShiftIdOrderByStageNumberDesc(activeShift.getId())).thenReturn(Optional.empty());

        when(orderRepository.sumCollectedAmountByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any()))
                .thenReturn(new BigDecimal("600000.00"));
        when(orderRepository.countCompletedOrdersByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any())).thenReturn(8);
        when(orderRepository.findByHouseholdIdAndShiftIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(eq(household.getId()), eq(activeShift.getId()), eq("CREATING")))
                .thenReturn(Collections.emptyList());

        when(userRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId())).thenReturn(List.of(sender, receiver));
        when(shiftRepository.findOpenShiftUserIdsByHouseholdId(household.getId())).thenReturn(Collections.emptyList());

        ShiftHandoverSummaryResponse summary = shiftHandoverService.getHandoverSummary(sender.getUsername());

        assertNotNull(summary);
        assertEquals(1, summary.getCurrentStage());
        assertEquals(new BigDecimal("1000000.00"), summary.getOpeningCash());
        assertEquals(new BigDecimal("600000.00"), summary.getCashRevenue());
        assertEquals(new BigDecimal("1600000.00"), summary.getExpectedCash());
        assertEquals(8, summary.getCompletedOrdersCount());
        assertEquals(1, summary.getEligibleRecipients().size());
        assertEquals(receiver.getId(), summary.getEligibleRecipients().get(0).getUserId());
        assertFalse(summary.getEligibleRecipients().get(0).getHasOpenShift());
    }

    @Test
    @DisplayName("TC-09: Chặn bàn giao khi tài khoản người nhận bị khóa (isActive = false)")
    void performShiftHandover_RecipientLocked_ThrowsException() {
        receiver.setIsActive(false);
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("raw_pwd")
                .actualCash(new BigDecimal("1500000.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.USER_BLOCKED, ex.getErrorCode());
        verify(shiftHandoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-10: Chặn bàn giao khi vai trò người nhận không phải VT-01 hoặc VT-02")
    void performShiftHandover_RecipientInvalidRole_ThrowsException() {
        Role accountantRole = Role.builder().id(3).code("VT-03").name("Kế toán").build();
        receiver.setRole(accountantRole);
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByUserIdAndStatus(sender.getId(), ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .recipientUserId(receiver.getId())
                .recipientPassword("raw_pwd")
                .actualCash(new BigDecimal("1500000.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.RECIPIENT_NOT_AUTHORIZED_FOR_POS, ex.getErrorCode());
        verify(shiftHandoverRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-11: Lấy báo cáo chặng ca khi ca đang mở có chứa chặng CURRENT")
    void getShiftStagesSummary_OpenShift_IncludesCurrentStage() {
        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findById(activeShift.getId())).thenReturn(Optional.of(activeShift));
        when(shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(activeShift.getId())).thenReturn(Collections.emptyList());
        when(orderRepository.sumCollectedAmountByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any()))
                .thenReturn(new BigDecimal("250000.00"));
        when(orderRepository.countCompletedOrdersByShiftIdAndTimeRange(eq(activeShift.getId()), any(), any())).thenReturn(3);

        ShiftStagesSummaryResponse response = shiftHandoverService.getShiftStagesSummary(sender.getUsername(), activeShift.getId());

        assertNotNull(response);
        assertEquals(activeShift.getId(), response.getShiftId());
        assertEquals("OPEN", response.getShiftStatus());
        assertEquals(1, response.getStages().size());
        assertEquals("CURRENT", response.getStages().get(0).getStageType());
        assertEquals(new BigDecimal("250000.00"), response.getTotalShiftRevenue());
    }

    @Test
    @DisplayName("NCL-03-CN-014: Chặn bàn giao ca khi còn phiếu chi tiền mặt chờ duyệt PENDING_APPROVAL")
    void testPerformShiftHandover_FailsWhenPendingExpenseExists() {
        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId("shift-1")
                .recipientUserId(receiver.getId())
                .recipientPassword("Pass@123")
                .actualCash(new BigDecimal("1500000"))
                .build();

        when(userRepository.findByUsername(sender.getUsername())).thenReturn(Optional.of(sender));
        when(shiftRepository.findByIdWithLock("shift-1")).thenReturn(Optional.of(activeShift));
        when(userRepository.findById(receiver.getId())).thenReturn(Optional.of(receiver));
        when(shiftRepository.existsByUserIdAndStatus(receiver.getId(), ShiftStatus.OPEN)).thenReturn(false);
        when(passwordEncoder.matches("Pass@123", receiver.getPasswordHash())).thenReturn(true);
        when(cashTransactionRepository.countByShiftIdAndStatus("shift-1", com.sales.constant.CashTransactionStatus.PENDING_APPROVAL))
                .thenReturn(2L);

        AppException ex = assertThrows(AppException.class, () ->
                shiftHandoverService.performShiftHandover(sender.getUsername(), request));

        assertEquals(ErrorCode.SHIFT_HAS_PENDING_EXPENSES, ex.getErrorCode());
        verify(shiftHandoverRepository, never()).save(any());
    }
}
