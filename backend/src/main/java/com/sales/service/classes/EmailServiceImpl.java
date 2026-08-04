package com.sales.service.classes;

import com.sales.repository.InvoiceDeliveryLogRepository;
import com.sales.service.interfaces.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final InvoiceDeliveryLogRepository invoiceDeliveryLogRepository;

    @Override
    @Async("taskExecutor")
    public void sendInvoiceEmailAsync(String deliveryLogId, String toEmail, String lookupUrl, String householdName, String lookupCode, BigDecimal finalAmount) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Hóa đơn điện tử từ " + householdName);
            
            String formattedAmount = finalAmount != null ? String.format("%,.0f", finalAmount.doubleValue()) : "0";
            
            String bodyContent = "    <p style=\"margin-top: 0; font-size: 16px;\">Kính gửi <strong>Quý khách hàng</strong>,</p>"
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
                    + "    <p style=\"font-size: 13px; color: #2563eb; word-break: break-all; margin: 5px 0 0 0;\"><a href=\"" + lookupUrl + "\" style=\"color: #2563eb; text-decoration: none;\">" + lookupUrl + "</a></p>";
            String htmlContent = buildHtmlEmail("HÓA ĐƠN ĐIỆN TỬ", "Cung cấp bởi BanHangViet", "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", bodyContent);
            
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

    @Override
    @Async("taskExecutor")
    public void sendDebtReminderEmailAsync(String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Thông báo nhắc nợ sắp đến hạn từ " + householdName);

            String formattedAmount = debtAmount != null ? String.format("%,.0f", debtAmount.doubleValue()) : "0";
            String formattedDueDate = dueDate != null ? dueDate.toLocalDate().toString() : "";

            String bodyContent = "    <p style=\"margin-top: 0; font-size: 16px;\">Kính gửi Ông/Bà <strong>" + customerName + "</strong>,</p>"
                    + "    <p>Chúng tôi xin thông báo về khoản công nợ sắp đến hạn thanh toán của Quý khách tại <strong>" + householdName + "</strong>:</p>"
                    + "    <div style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;\">"
                    + "      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b; width: 40%;\">Khách hàng:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #0f172a;\">" + customerName + "</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Đơn vị bán hàng:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: 500; color: #0f172a;\">" + householdName + "</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Số tiền nợ:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #e11d48; font-size: 16px;\">" + formattedAmount + " VND</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Ngày đến hạn:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #0f172a;\">" + formattedDueDate + "</td>"
                    + "        </tr>"
                    + "      </table>"
                    + "    </div>"
                    + "    <p style=\"margin-bottom: 25px;\">Rất mong Quý khách sắp xếp thanh toán đúng hạn. Trân trọng cảm ơn!</p>";
            String htmlContent = buildHtmlEmail("NHẮC NHỞ CÔNG NỢ ĐẾN HẠN", "Cung cấp bởi BanHangViet", "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", bodyContent);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email nhắc nợ trước hạn gửi thành công tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email nhắc nợ trước hạn tới {}", toEmail, e);
        }
    }

    @Override
    @Async("taskExecutor")
    public void sendOverdueDebtReminderEmailAsync(String toEmail, String customerName, String householdName, BigDecimal debtAmount, LocalDateTime dueDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Cảnh báo nợ quá hạn từ " + householdName);

            String formattedAmount = debtAmount != null ? String.format("%,.0f", debtAmount.doubleValue()) : "0";
            String formattedDueDate = dueDate != null ? dueDate.toLocalDate().toString() : "";

            String bodyContent = "    <p style=\"margin-top: 0; font-size: 16px;\">Kính gửi Ông/Bà <strong>" + customerName + "</strong>,</p>"
                    + "    <p>Chúng tôi xin thông báo khoản công nợ của Quý khách tại <strong>" + householdName + "</strong> đã vượt quá thời hạn thanh toán quy định:</p>"
                    + "    <div style=\"background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 16px; margin: 20px 0;\">"
                    + "      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b; width: 40%;\">Khách hàng:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #0f172a;\">" + customerName + "</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Đơn vị bán hàng:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: 500; color: #0f172a;\">" + householdName + "</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Số tiền nợ quá hạn:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #e11d48; font-size: 16px;\">" + formattedAmount + " VND</td>"
                    + "        </tr>"
                    + "        <tr>"
                    + "          <td style=\"padding: 6px 0; color: #64748b;\">Ngày phải thanh toán:</td>"
                    + "          <td style=\"padding: 6px 0; font-weight: bold; color: #e11d48;\">" + formattedDueDate + "</td>"
                    + "        </tr>"
                    + "      </table>"
                    + "    </div>"
                    + "    <p style=\"margin-bottom: 25px; color: #be123c;\">Kính mong Quý khách nhanh chóng sắp xếp thanh toán dứt điểm khoản nợ này. Trân trọng cảm ơn!</p>";
            String htmlContent = buildHtmlEmail("CẢNH BÁO NỢ QUÁ HẠN", "Cung cấp bởi BanHangViet", "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", bodyContent);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email nhắc nợ quá hạn gửi thành công tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email nhắc nợ quá hạn tới {}", toEmail, e);
        }
    }

    private String buildHtmlEmail(String title, String subtitle, String headerGradient, String bodyContent) {
        return "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);\">"
                + "  <div style=\"background: " + headerGradient + "; padding: 24px; text-align: center; color: white;\">"
                + "    <h2 style=\"margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;\">" + title + "</h2>"
                + "    <p style=\"margin: 4px 0 0 0; opacity: 0.85; font-size: 14px;\">" + subtitle + "</p>"
                + "  </div>"
                + "  <div style=\"padding: 24px; background-color: #ffffff; color: #333333; line-height: 1.6;\">"
                + bodyContent
                + "  </div>"
                + "  <div style=\"background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;\">"
                + "    <p style=\"margin: 0 0 4px 0;\">Đây là thư điện tử được gửi tự động từ hệ thống <strong>BanHangViet</strong>.</p>"
                + "    <p style=\"margin: 0;\">Vui lòng không phản hồi thư này. Xin cảm ơn!</p>"
                + "  </div>"
                + "</div>";
    }

}
