package com.sales.service.interfaces;

import com.sales.dto.request.CreateInvoiceErrorNoticeRequest;
import com.sales.dto.response.InvoiceErrorNoticeResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;

import java.util.List;

public interface InvoiceErrorNoticeService {

    /**
     * Lấy danh sách hóa đơn đã HỦY hoặc ĐIỀU CHỈNH chưa có thông báo sai sót được CQT tiếp nhận (NCL-05-CN-005)
     */
    List<InvoiceResponse> getEligibleInvoicesForNotice(String username);

    /**
     * Khởi tạo thông báo sai sót Mẫu 04/SS-HĐĐT ở trạng thái nháp
     */
    InvoiceErrorNoticeResponse createErrorNotice(String username, CreateInvoiceErrorNoticeRequest request);

    /**
     * Gửi thông báo sai sót tới Cơ quan thuế mô phỏng
     */
    InvoiceErrorNoticeResponse sendNoticeToTaxAuthority(String username, String noticeId);

    /**
     * Lấy chi tiết thông báo sai sót
     */
    InvoiceErrorNoticeResponse getNotice(String username, String noticeId);

    /**
     * Tra cứu danh sách thông báo sai sót của hộ kinh doanh
     */
    PageResponse<InvoiceErrorNoticeResponse> getNotices(String username, String status, int page, int size);

    /**
     * Mô phỏng Cơ quan thuế từ chối tiếp nhận thông báo sai sót (NCL-05-CN-005-TC-03)
     */
    InvoiceErrorNoticeResponse rejectNoticeByTaxAuthority(String username, String noticeId, String reason);

    /**
     * Đưa thông báo bị từ chối về trạng thái nháp để kế toán sửa và gửi lại (NCL-05-CN-005-TC-03)
     */
    InvoiceErrorNoticeResponse reopenNoticeToDraft(String username, String noticeId);

    /**
     * Cập nhật thông tin thông báo sai sót ở trạng thái DRAFT hoặc REJECTED
     */
    InvoiceErrorNoticeResponse updateErrorNotice(String username, String noticeId, CreateInvoiceErrorNoticeRequest request);
}
