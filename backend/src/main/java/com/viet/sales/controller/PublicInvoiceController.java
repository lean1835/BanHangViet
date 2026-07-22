package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.response.PublicInvoiceResponse;
import com.viet.sales.service.interfaces.EInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/invoices")
@RequiredArgsConstructor
public class PublicInvoiceController {

    private final EInvoiceService eInvoiceService;

    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<PublicInvoiceResponse>> lookupInvoice(
            @RequestParam String code) {
        PublicInvoiceResponse result = eInvoiceService.lookupInvoicePublicly(code);
        ApiResponse<PublicInvoiceResponse> response = ApiResponse.<PublicInvoiceResponse>builder()
                .code(1000)
                .message("Tra cứu hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadInvoiceFile(
            @RequestParam String code,
            @RequestParam(defaultValue = "pdf") String format) {
        byte[] fileBytes = eInvoiceService.downloadInvoiceFilePublicly(code, format);
        
        String filename = "HoaDon_" + code + ("xml".equalsIgnoreCase(format) ? ".xml" : ".html");
        MediaType mediaType = "xml".equalsIgnoreCase(format) ? MediaType.APPLICATION_XML : MediaType.TEXT_HTML;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(fileBytes);
    }
}
