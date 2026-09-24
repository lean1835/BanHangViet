package com.sales.modules.support.controller;
import com.sales.common.dto.PageResponse;
import com.sales.modules.support.dto.response.FaqCategoryGroupResponse;
import com.sales.modules.support.dto.response.FaqItemResponse;
import com.sales.modules.support.dto.response.SupportChannelResponse;
import com.sales.modules.support.dto.response.SupportInfoResponse;
import com.sales.common.constant.FaqCategory;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.support.dto.request.CreateFaqItemRequest;
import com.sales.modules.support.dto.request.CreateSupportChannelRequest;
import com.sales.modules.support.dto.request.UpdateFaqItemRequest;
import com.sales.modules.support.dto.request.UpdateSupportChannelRequest;
import com.sales.modules.support.service.FaqService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/faqs")
@RequiredArgsConstructor
@Tag(name = "FAQ & Support Controller", description = "Màn hình câu hỏi thường gặp và thông tin hỗ trợ kỹ thuật (NCL-19-CN-004)")
public class FaqController {

    private final FaqService faqService;

    @Operation(summary = "Tra cứu câu hỏi thường gặp theo từ khóa hoặc nhóm", description = "Tìm kiếm trong tiêu đề, nội dung tóm tắt và từ khóa tags (TC-01, TC-02)")
    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<FaqItemResponse>>> getFaqs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) FaqCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<FaqItemResponse> result = faqService.getFaqs(keyword, category, page, size);
        String message = (result.getContent() == null || result.getContent().isEmpty())
                ? "Không tìm thấy câu hỏi phù hợp với từ khóa"
                : "Tra cứu câu hỏi thường gặp thành công";

        ApiResponse<PageResponse<FaqItemResponse>> response = ApiResponse.<PageResponse<FaqItemResponse>>builder()
                .code(1000)
                .message(message)
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Danh sách câu hỏi phân nhóm theo 4 Category chuẩn", description = "Lấy toàn bộ câu hỏi gom nhóm theo Hóa đơn, Bán hàng, Tài khoản, Dữ liệu")
    @GetMapping("/grouped")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<List<FaqCategoryGroupResponse>>> getFaqsGrouped() {
        List<FaqCategoryGroupResponse> result = faqService.getFaqsGroupedByCategory();
        ApiResponse<List<FaqCategoryGroupResponse>> response = ApiResponse.<List<FaqCategoryGroupResponse>>builder()
                .code(1000)
                .message("Lấy danh mục câu hỏi phân nhóm thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Xem chi tiết câu hỏi và tự động tăng lượt xem", description = "Lấy nội dung câu trả lời đầy đủ kèm đường dẫn mở màn hình xử lý")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<FaqItemResponse>> getFaqDetail(Principal principal, @PathVariable String id) {
        String username = (principal != null) ? principal.getName() : null;
        FaqItemResponse result = faqService.getFaqDetailAndIncrementView(username, id);
        ApiResponse<FaqItemResponse> response = ApiResponse.<FaqItemResponse>builder()
                .code(1000)
                .message("Lấy chi tiết câu hỏi thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Màn hình thông tin hỗ trợ kỹ thuật và định danh hộ kinh doanh", description = "Cung cấp phiên bản phần mềm, mã hộ kinh doanh, tên hộ, mã số thuế và các kênh hotline/Zalo khi báo lỗi (TC-03)")
    @GetMapping("/support-info")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<SupportInfoResponse>> getSupportInfo(Principal principal) {
        String username = (principal != null) ? principal.getName() : null;
        SupportInfoResponse result = faqService.getSupportInfo(username);
        ApiResponse<SupportInfoResponse> response = ApiResponse.<SupportInfoResponse>builder()
                .code(1000)
                .message("Lấy thông tin hỗ trợ kỹ thuật thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Danh sách kênh liên hệ hỗ trợ kỹ thuật", description = "Lấy số Hotline, Zalo, Email và thời gian hỗ trợ đang hoạt động")
    @GetMapping("/support-channels")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<List<SupportChannelResponse>>> getActiveSupportChannels() {
        List<SupportChannelResponse> result = faqService.getActiveSupportChannels();
        ApiResponse<List<SupportChannelResponse>> response = ApiResponse.<List<SupportChannelResponse>>builder()
                .code(1000)
                .message("Lấy danh sách kênh hỗ trợ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // Các API dành cho Quản trị nền tảng (VT-04: Platform Admin)
    // =========================================================================

    @Operation(summary = "Tạo câu hỏi thường gặp mới", description = "Quản trị nền tảng thêm câu hỏi vào hệ thống mà không cần triển khai lại phần mềm")
    @PostMapping
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<FaqItemResponse>> createFaq(
            Principal principal,
            @Valid @RequestBody CreateFaqItemRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        FaqItemResponse result = faqService.createFaq(username, request);
        ApiResponse<FaqItemResponse> response = ApiResponse.<FaqItemResponse>builder()
                .code(1000)
                .message("Tạo câu hỏi thường gặp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cập nhật câu hỏi thường gặp", description = "Quản trị nền tảng cập nhật câu hỏi, câu trả lời hoặc liên kết màn hình")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<FaqItemResponse>> updateFaq(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateFaqItemRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        FaqItemResponse result = faqService.updateFaq(username, id, request);
        ApiResponse<FaqItemResponse> response = ApiResponse.<FaqItemResponse>builder()
                .code(1000)
                .message("Cập nhật câu hỏi thường gặp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Xóa câu hỏi thường gặp", description = "Quản trị nền tảng xóa bỏ câu hỏi khỏi hệ thống")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<Void>> deleteFaq(
            Principal principal,
            @PathVariable String id) {
        String username = (principal != null) ? principal.getName() : null;
        faqService.deleteFaq(username, id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa câu hỏi thường gặp thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Thêm mới kênh hỗ trợ kỹ thuật", description = "Quản trị nền tảng thêm số hotline, Zalo hoặc Email hỗ trợ mới")
    @PostMapping("/support-channels")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<SupportChannelResponse>> createSupportChannel(
            Principal principal,
            @Valid @RequestBody CreateSupportChannelRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        SupportChannelResponse result = faqService.createSupportChannel(username, request);
        ApiResponse<SupportChannelResponse> response = ApiResponse.<SupportChannelResponse>builder()
                .code(1000)
                .message("Thêm kênh hỗ trợ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cập nhật kênh hỗ trợ kỹ thuật", description = "Quản trị nền tảng sửa thông tin kênh hỗ trợ")
    @PutMapping("/support-channels/{id}")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<SupportChannelResponse>> updateSupportChannel(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateSupportChannelRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        SupportChannelResponse result = faqService.updateSupportChannel(username, id, request);
        ApiResponse<SupportChannelResponse> response = ApiResponse.<SupportChannelResponse>builder()
                .code(1000)
                .message("Cập nhật kênh hỗ trợ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Xóa kênh hỗ trợ kỹ thuật", description = "Quản trị nền tảng xóa kênh hỗ trợ")
    @DeleteMapping("/support-channels/{id}")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<Void>> deleteSupportChannel(
            Principal principal,
            @PathVariable String id) {
        String username = (principal != null) ? principal.getName() : null;
        faqService.deleteSupportChannel(username, id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa kênh hỗ trợ thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Danh sách toàn bộ câu hỏi dành cho Quản trị viên", description = "Bao gồm cả các câu hỏi đang tạm ẩn, hỗ trợ lọc theo trạng thái")
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<FaqItemResponse>>> getAllFaqsForAdmin(
            Principal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FaqCategory category,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String username = (principal != null) ? principal.getName() : null;
        PageResponse<FaqItemResponse> result = faqService.getAllFaqsForAdmin(username, search, category, isActive, page, size);
        ApiResponse<PageResponse<FaqItemResponse>> response = ApiResponse.<PageResponse<FaqItemResponse>>builder()
                .code(1000)
                .message("Lấy danh sách quản trị câu hỏi thường gặp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
