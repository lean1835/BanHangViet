package com.sales.service.interfaces;

import com.sales.constant.FaqCategory;
import com.sales.dto.request.CreateFaqItemRequest;
import com.sales.dto.request.CreateSupportChannelRequest;
import com.sales.dto.request.UpdateFaqItemRequest;
import com.sales.dto.request.UpdateSupportChannelRequest;
import com.sales.dto.response.FaqCategoryGroupResponse;
import com.sales.dto.response.FaqItemResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.SupportChannelResponse;
import com.sales.dto.response.SupportInfoResponse;

import java.util.List;

public interface FaqService {

    // Tra cứu danh sách câu hỏi thường gặp theo từ khóa và nhóm chuyên mục (TC-01, TC-02)
    PageResponse<FaqItemResponse> getFaqs(String keyword, FaqCategory category, int page, int size);

    // Gom nhóm câu hỏi theo 4 danh mục chuẩn hóa: INVOICE, SALES, ACCOUNT, DATA
    List<FaqCategoryGroupResponse> getFaqsGroupedByCategory();

    // Xem chi tiết câu hỏi và tự động tăng view_count
    FaqItemResponse getFaqDetailAndIncrementView(String currentUsername, String id);

    // Lấy thông tin hỗ trợ kỹ thuật và định danh hộ kinh doanh khi báo lỗi (TC-03)
    SupportInfoResponse getSupportInfo(String currentUsername);

    // Lấy danh sách kênh hỗ trợ kỹ thuật đang hoạt động
    List<SupportChannelResponse> getActiveSupportChannels();

    // Các phương thức quản trị dành cho Quản trị nền tảng (VT-04)
    FaqItemResponse createFaq(String currentUsername, CreateFaqItemRequest request);

    FaqItemResponse updateFaq(String currentUsername, String id, UpdateFaqItemRequest request);

    void deleteFaq(String currentUsername, String id);

    SupportChannelResponse createSupportChannel(String currentUsername, CreateSupportChannelRequest request);

    SupportChannelResponse updateSupportChannel(String currentUsername, String id, UpdateSupportChannelRequest request);

    void deleteSupportChannel(String currentUsername, String id);

    PageResponse<FaqItemResponse> getAllFaqsForAdmin(String currentUsername, String search, FaqCategory category, Boolean isActive, int page, int size);
}
