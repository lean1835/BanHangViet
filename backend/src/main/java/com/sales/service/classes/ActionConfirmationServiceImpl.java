package com.sales.service.classes;

import com.sales.constant.ActionSeverity;
import com.sales.constant.ActionType;
import com.sales.dto.response.ActionConsequenceResponse;
import com.sales.entity.EInvoice;
import com.sales.entity.Order;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.ActionConfirmationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActionConfirmationServiceImpl implements ActionConfirmationService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EInvoiceRepository invoiceRepository;

    @Override
    @Transactional(readOnly = true)
    public ActionConsequenceResponse getActionConsequences(String username, ActionType actionType, String targetId) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        if (actionType == null) {
            throw new AppException(ErrorCode.UNSUPPORTED_ACTION_TYPE);
        }

        if (targetId == null || targetId.trim().isEmpty()) {
            throw new AppException(ErrorCode.TARGET_OBJECT_NOT_FOUND);
        }

        return switch (actionType) {
            case CANCEL_ORDER -> analyzeCancelOrderConsequence(user, targetId.trim());
            case CANCEL_INVOICE -> analyzeCancelInvoiceConsequence(user, targetId.trim());
            default -> throw new AppException(ErrorCode.UNSUPPORTED_ACTION_TYPE);
        };
    }

    private ActionConsequenceResponse analyzeCancelOrderConsequence(User user, String orderId) {
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.TARGET_OBJECT_NOT_FOUND));

        if ("CANCELED".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELED);
        }
        if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CANCEL);
        }
        if (!"CREATING".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_CANCEL_NOT_CREATING_STATUS);
        }

        List<String> consequences = new ArrayList<>();
        String totalAmountFormatted = String.format("%,.0f đ", order.getFinalAmount());
        int itemCount = order.getItems() != null ? order.getItems().size() : 0;

        consequences.add(String.format("Đơn bán hàng gồm %d mặt hàng với tổng số tiền %s sẽ bị hủy bỏ hoàn toàn.",
                itemCount, totalAmountFormatted));

        if (order.getDiningTable() != null) {
            consequences.add(String.format("Bàn '%s' đang gắn với đơn sẽ được giải phóng về trạng thái trống.",
                    order.getDiningTable().getName()));
        }

        consequences.add("Tồn kho hàng hóa không bị thay đổi (do đơn đang tạo dở dang và chưa hoàn tất trừ kho).");
        consequences.add("Thao tác này KHÔNG THỂ HOÀN TÁC. Bạn không thể khôi phục lại đơn hàng sau khi xác nhận hủy.");

        String orderCode = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId().substring(0, 8);

        return ActionConsequenceResponse.builder()
                .actionType(ActionType.CANCEL_ORDER)
                .actionName("Hủy đơn hàng")
                .targetId(order.getId())
                .targetCode(orderCode)
                .targetSummary(String.format("Đơn hàng %s - Tổng tiền: %s", orderCode, totalAmountFormatted))
                .isIrreversible(true)
                .severity(ActionSeverity.DANGER)
                .warningTitle("Xác nhận hủy đơn hàng đang bán")
                .consequences(consequences)
                .confirmPrompt("Bạn có chắc chắn muốn hủy bỏ đơn hàng này không?")
                .confirmButtonText("Tôi hiểu hậu quả, Hủy đơn ngay")
                .cancelButtonText("Quay lại màn hình bán")
                .build();
    }

    private ActionConsequenceResponse analyzeCancelInvoiceConsequence(User user, String invoiceId) {
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // QTN & RBAC: Chỉ Chủ hộ (VT-01) và Kế toán (VT-03) mới có quyền hủy hóa đơn
        String role = user.getRole() != null ? user.getRole().getCode() : null;
        if (!"VT-01".equals(role) && !"VT-03".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        EInvoice invoice = invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(invoiceId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.TARGET_OBJECT_NOT_FOUND));

        if ("CANCELED".equalsIgnoreCase(invoice.getStatus())
                || (!"ISSUED".equalsIgnoreCase(invoice.getStatus()) && !"TAX_CODE_GRANTED".equalsIgnoreCase(invoice.getStatus()))) {
            throw new AppException(ErrorCode.INVOICE_CANNOT_BE_CANCELED);
        }

        List<String> consequences = new ArrayList<>();
        String totalAmountFormatted = String.format("%,.0f đ", invoice.getFinalAmount());
        String invoiceNumberStr = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "(Hóa đơn chưa cấp số)";
        String seriesStr = invoice.getInvoiceSymbol() != null ? invoice.getInvoiceSymbol() : "";

        consequences.add(String.format("Hóa đơn điện tử số %s (Ký hiệu: %s) trị giá %s sẽ chuyển sang trạng thái ĐÃ HỦY.",
                invoiceNumberStr, seriesStr, totalAmountFormatted));

        if ("TAX_CODE_GRANTED".equals(invoice.getStatus()) || invoice.getTaxAuthorityCode() != null) {
            consequences.add("Hóa đơn đã được CƠ QUAN THUẾ CẤP MÃ. Hệ thống sẽ tạo hồ sơ thông báo sai sót gửi cơ quan thuế theo đúng Nghị định 123/2020/NĐ-CP.");
            consequences.add("Khách hàng khi tra cứu mã QR hoặc liên kết hóa đơn sẽ thấy trạng thái 'Hóa đơn đã bị hủy bỏ'.");
        } else {
            consequences.add("Hóa đơn chưa cấp mã thuế sẽ bị hủy trực tiếp trên hệ thống và không được gửi tiếp lên cơ quan thuế.");
        }

        consequences.add("Doanh thu tính thuế của hộ kinh doanh sẽ được loại trừ số tiền của hóa đơn này.");
        consequences.add("Hành động hủy hóa đơn là KHÔNG THỂ ĐẢO NGƯỢC và được lưu vết kiểm toán vĩnh viễn.");

        return ActionConsequenceResponse.builder()
                .actionType(ActionType.CANCEL_INVOICE)
                .actionName("Hủy hóa đơn điện tử")
                .targetId(invoice.getId())
                .targetCode(invoiceNumberStr)
                .targetSummary(String.format("HĐĐT %s - Ký hiệu: %s - Tổng tiền: %s", invoiceNumberStr, seriesStr, totalAmountFormatted))
                .isIrreversible(true)
                .severity(ActionSeverity.DANGER)
                .warningTitle("Cảnh báo hủy hóa đơn điện tử chính thức")
                .consequences(consequences)
                .confirmPrompt("Hóa đơn là chứng từ thuế có giá trị pháp lý. Bạn có chắc chắn muốn hủy hóa đơn này?")
                .confirmButtonText("Xác nhận hủy hóa đơn và lập thông báo")
                .cancelButtonText("Không hủy, giữ nguyên hóa đơn")
                .build();
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkUserActive(User user) {
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }
    }
}
