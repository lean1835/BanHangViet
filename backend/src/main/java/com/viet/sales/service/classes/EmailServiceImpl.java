package com.viet.sales.service.classes;

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

    @Override
    @Async
    public void sendInvoiceEmailAsync(String toEmail, String lookupUrl, String householdName, String lookupCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Hóa đơn điện tử từ " + householdName);
            
            String htmlContent = "<h3>Kính gửi quý khách hàng,</h3>"
                    + "<p>Chúng tôi xin gửi hóa đơn điện tử cho giao dịch mua hàng của quý khách tại <b>" + householdName + "</b>.</p>"
                    + "<p>Mã tra cứu hóa đơn của quý khách là: <b>" + lookupCode + "</b></p>"
                    + "<p>Quý khách có thể tra cứu và tải lại hóa đơn tại liên kết sau: <a href=\"" + lookupUrl + "\">" + lookupUrl + "</a></p>"
                    + "<br/>"
                    + "<p>Trân trọng cảm ơn quý khách!</p>";
            
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email gửi thành công tới {}", toEmail);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email tới {}", toEmail, e);
        }
    }
}
