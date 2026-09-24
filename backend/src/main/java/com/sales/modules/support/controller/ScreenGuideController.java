package com.sales.modules.support.controller;
import com.sales.common.dto.PageResponse;
import com.sales.modules.support.dto.response.ContextualGuideResponse;
import com.sales.modules.support.dto.response.ScreenGuideResponse;
import com.sales.modules.support.dto.response.ScreenGuideSummaryResponse;
import com.sales.modules.support.dto.response.ScreenGuideTopViewedResponse;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.support.dto.request.CreateScreenGuideRequest;
import com.sales.modules.support.dto.request.TrackScreenGuideViewRequest;
import com.sales.modules.support.dto.request.UpdateScreenGuideRequest;
import com.sales.modules.support.service.ScreenGuideService;
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
@RequestMapping("/api/v1/screen-guides")
@RequiredArgsConstructor
@Tag(name = "Screen Guide Controller", description = "Quản lý và hiển thị hướng dẫn ngắn tại chỗ theo từng màn hình (NCL-19-CN-003)")
public class ScreenGuideController {

    private final ScreenGuideService screenGuideService;

    @Operation(summary = "Xem hướng dẫn ngắn tại chỗ theo mã màn hình", description = "Lấy nội dung hướng dẫn gồm 3-5 bước kèm vị trí nút bấm và ảnh minh họa (TC-01)")
    @GetMapping("/{screenCode}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<ScreenGuideResponse>> getGuideByScreenCode(
            Principal principal,
            @PathVariable String screenCode) {
        String username = (principal != null) ? principal.getName() : null;
        ScreenGuideResponse result = screenGuideService.getGuideByScreenCode(username, screenCode);
        ApiResponse<ScreenGuideResponse> response = ApiResponse.<ScreenGuideResponse>builder()
                .code(1000)
                .message("Lấy hướng dẫn màn hình thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Ghi nhận lịch sử mở xem trợ giúp", description = "Ghi nhận thời gian xem và mức độ hoàn thành để theo dõi điểm nghẽn UX (TC-03)")
    @PostMapping("/{screenCode}/track-view")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<Void>> trackGuideView(
            Principal principal,
            @PathVariable String screenCode,
            @Valid @RequestBody(required = false) TrackScreenGuideViewRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        screenGuideService.trackGuideView(username, screenCode, request);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Ghi nhận lượt xem trợ giúp thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Báo cáo Top màn hình mở trợ giúp nhiều nhất", description = "Thống kê các màn hình có số lượt xem cao nhất để nhận diện điểm nghẽn UX (TC-03)")
    @GetMapping("/statistics/top-viewed")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<List<ScreenGuideTopViewedResponse>>> getTopViewedGuides(
            @RequestParam(defaultValue = "10") int limit) {
        List<ScreenGuideTopViewedResponse> result = screenGuideService.getTopViewedGuides(limit);
        ApiResponse<List<ScreenGuideTopViewedResponse>> response = ApiResponse.<List<ScreenGuideTopViewedResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thống kê màn hình mở trợ giúp nhiều nhất thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Tra cứu liên kết ngữ cảnh lỗi", description = "Lấy đường dẫn màn hình khai báo và mã hướng dẫn dựa trên mã lỗi nghiệp vụ (TC-02)")
    @GetMapping("/contextual-help")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<ContextualGuideResponse>> getContextualHelp(
            @RequestParam int errorCode) {
        ContextualGuideResponse result = screenGuideService.getContextualHelpByErrorCode(errorCode);
        ApiResponse<ContextualGuideResponse> response = ApiResponse.<ContextualGuideResponse>builder()
                .code(1000)
                .message("Lấy thông tin hỗ trợ ngữ cảnh thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Danh sách danh mục hướng dẫn màn hình", description = "Xem toàn bộ hướng dẫn màn hình hệ thống hỗ trợ phân trang và tìm kiếm")
    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<ScreenGuideSummaryResponse>>> getAllGuides(
            Principal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String targetRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String username = (principal != null) ? principal.getName() : null;
        PageResponse<ScreenGuideSummaryResponse> result = screenGuideService.getAllGuides(
                username, search, targetRole, page, size);
        ApiResponse<PageResponse<ScreenGuideSummaryResponse>> response = ApiResponse.<PageResponse<ScreenGuideSummaryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hướng dẫn màn hình thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Tạo mới hướng dẫn màn hình", description = "Chỉ quản trị nền tảng (VT-04) mới có quyền tạo mới hướng dẫn màn hình")
    @PostMapping
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<ScreenGuideResponse>> createGuide(
            Principal principal,
            @Valid @RequestBody CreateScreenGuideRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        ScreenGuideResponse result = screenGuideService.createGuide(username, request);
        ApiResponse<ScreenGuideResponse> response = ApiResponse.<ScreenGuideResponse>builder()
                .code(1000)
                .message("Tạo mới hướng dẫn màn hình thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cập nhật nội dung hướng dẫn màn hình", description = "Sửa đổi nội dung các bước hướng dẫn mà không cần sửa mã nguồn ứng dụng")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<ScreenGuideResponse>> updateGuide(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateScreenGuideRequest request) {
        String username = (principal != null) ? principal.getName() : null;
        ScreenGuideResponse result = screenGuideService.updateGuide(username, id, request);
        ApiResponse<ScreenGuideResponse> response = ApiResponse.<ScreenGuideResponse>builder()
                .code(1000)
                .message("Cập nhật hướng dẫn màn hình thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Xóa/Vô hiệu hóa hướng dẫn màn hình", description = "Tạm dừng hiển thị hướng dẫn màn hình trên giao diện người dùng")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-04')")
    public ResponseEntity<ApiResponse<Void>> deleteGuide(
            Principal principal,
            @PathVariable String id) {
        String username = (principal != null) ? principal.getName() : null;
        screenGuideService.deleteGuide(username, id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa hướng dẫn màn hình thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
