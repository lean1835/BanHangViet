package com.sales.modules.support.service;
import com.sales.common.constant.FaqCategory;
import com.sales.modules.support.dto.request.CreateFaqItemRequest;
import com.sales.modules.support.dto.request.CreateSupportChannelRequest;
import com.sales.modules.support.dto.request.UpdateFaqItemRequest;
import com.sales.modules.support.dto.request.UpdateSupportChannelRequest;
import com.sales.modules.support.dto.response.FaqCategoryGroupResponse;
import com.sales.modules.support.dto.response.FaqItemResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.support.dto.response.SupportChannelResponse;
import com.sales.modules.support.dto.response.SupportInfoResponse;

import java.util.List;

public interface FaqService {
    PageResponse<FaqItemResponse> getFaqs(String keyword, FaqCategory category, int page, int size);

    List<FaqCategoryGroupResponse> getFaqsGroupedByCategory();

    FaqItemResponse getFaqDetailAndIncrementView(String currentUsername, String id);

    SupportInfoResponse getSupportInfo(String currentUsername);

    List<SupportChannelResponse> getActiveSupportChannels();

    FaqItemResponse createFaq(String currentUsername, CreateFaqItemRequest request);

    FaqItemResponse updateFaq(String currentUsername, String id, UpdateFaqItemRequest request);

    void deleteFaq(String currentUsername, String id);

    SupportChannelResponse createSupportChannel(String currentUsername, CreateSupportChannelRequest request);

    SupportChannelResponse updateSupportChannel(String currentUsername, String id, UpdateSupportChannelRequest request);

    void deleteSupportChannel(String currentUsername, String id);

    PageResponse<FaqItemResponse> getAllFaqsForAdmin(String currentUsername, String search, FaqCategory category, Boolean isActive, int page, int size);
}
