package com.sales.service.interfaces;

import com.sales.dto.request.CheckExchangeEligibilityRequest;
import com.sales.dto.request.CreateProductExchangeRequest;
import com.sales.dto.response.ExchangeEligibilityResponse;
import com.sales.dto.response.ProductExchangeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductExchangeService {

    /**
     * NCL-11-CN-005: Kiểm tra tính hợp lệ và tính toán chênh lệch giá trị đổi hàng
     */
    ExchangeEligibilityResponse checkEligibility(CheckExchangeEligibilityRequest request, String currentUsername);

    /**
     * NCL-11-CN-005: Tạo phiếu đổi hàng (Ngang giá / Món giá cao hơn / Chặn món giá thấp hơn)
     */
    ProductExchangeResponse createProductExchange(CreateProductExchangeRequest request, String currentUsername);

    /**
     * NCL-11-CN-005: Tra cứu chi tiết phiếu đổi hàng theo ID
     */
    ProductExchangeResponse getExchangeTicketById(String id, String currentUsername);

    /**
     * NCL-11-CN-005: Tra cứu danh sách phiếu đổi hàng có phân trang và bộ lọc
     */
    Page<ProductExchangeResponse> getExchangeTickets(
            String invoiceId,
            String exchangeType,
            String status,
            Pageable pageable,
            String currentUsername);
}
