package com.viet.sales.service.classes;

import com.viet.sales.repository.InvoiceDeliveryLogRepository;
import com.viet.sales.service.interfaces.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final InvoiceDeliveryLogRepository invoiceDeliveryLogRepository;

    @Override
    @Async("taskExecutor")
    @org.springframework.transaction.annotation.Transactional
    public void sendInvoiceEmailAsync(String deliveryLogId, String toEmail, String lookupUrl, String householdName, String lookupCode, java.math.BigDecimal finalAmount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Hóa đơn điện tử từ " + householdName);
            
            String formattedAmount = finalAmount != null ? String.format("%,.0f", finalAmount.doubleValue()) : "0";
            
            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);\">"
                    + "  <div style=\"background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 24px; text-align: center; color: white;\">"
                    + "    <h2 style=\"margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;\">HÓA ĐƠN ĐIỆN TỬ</h2>"
                    + "    <p style=\"margin: 4px 0 0 0; opacity: 0.85; font-size: 14px;\">Cung cấp bởi BanHangViet</p>"
                    + "  </div>"
                    + "  <div style=\"padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;\">"
                    + "    <p style=\"margin-top: 0; font-size: 16px;\">Kính gửi <strong>Quý khách hàng</strong>,</p>"
                    + "    <p>Chúng tôi xin gửi thông tin hóa đơn điện tử cho giao dịch mua sắm của Quý khách tại đơn vị <strong>" + householdName + "</strong>:</p>"
                    + "    <div style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;\">"
                    + "      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b; width: 40%;\">Mã tra cứu:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #0f172a;\">" + lookupCode + "</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Đơn vị bán hàng:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: 500; color: #0f172a;\">" + householdName + "</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Tổng tiền thanh toán:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #e11d48; font-size: 16px;\">" + formattedAmount + " VND</td>"
                    + "        </tr>"
                    + "      </table>"
                    + "    </div>"
                    + "    <p style=\"margin-bottom: 25px;\">Để xem chi tiết và tải hóa đơn (định dạng PDF/XML), vui lòng bấm vào nút dưới đây:</p>"
                    + "    <div style=\"text-align: center; margin: 30px 0;\">"
                    + "      <a href=\"" + lookupUrl + "\" style=\"background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; font-weight: bold; border-radius: 6px; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);\">Xem Chi Tiết Hóa Đơn</a>"
                    + "    </div>"
                    + "    <hr style=\"border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;\" />"
                    + "    <p style=\"font-size: 13px; color: #64748b; margin: 0;\">Nếu nút trên không hoạt động, Quý khách có thể sao chép liên kết sau và dán vào trình duyệt:</p>"
                    + "    <p style=\"font-size: 13px; color: #2563eb; word-break: break-all; margin: 5px 0 0 0;\"><a href=\"" + lookupUrl + "\" style=\"color: #2563eb; text-decoration: none;\">" + lookupUrl + "</a></p>"
                    + "  </div>"
                    + "  <div style=\"background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;\">"
                    + "    <p style=\"margin: 0 0 4px 0;\">Đây là thư điện tử được gửi tự động từ hệ thống quản lý bán hàng <strong>BanHangViet</strong>.</p>"
                    + "    <p style=\"margin: 0;\">Vui lòng không phản hồi thư này. Xin cảm ơn!</p>"
                    + "  </div>"
                    + "</div>";
            
            helper.setText(htmlContent, true);

            mailSender.send(message);
            updateDeliveryLog(deliveryLogId, "SUCCESS", null);
            log.info("Email gửi thành công tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}", toEmail, e);
            updateDeliveryLog(deliveryLogId, "FAILED", e.getMessage());
        }
    }

    private void updateDeliveryLog(String logId, String status, String errorMsg) {
        try {
            invoiceDeliveryLogRepository.findById(logId).ifPresent(logRecord -> {
                logRecord.setStatus(status);
                logRecord.setErrorMessage(errorMsg);
                invoiceDeliveryLogRepository.save(logRecord);
            });
        } catch (Exception ex) {
            log.error("Lỗi khi cập nhật trạng thái giao nhận hóa đơn ID={}", logId, ex);
        }
    }

}
