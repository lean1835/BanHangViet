package com.sales.initializer;

import com.sales.constant.FaqCategory;
import com.sales.constant.SupportChannelType;
import com.sales.entity.FaqItem;
import com.sales.entity.SupportChannel;
import com.sales.repository.FaqItemRepository;
import com.sales.repository.SupportChannelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Tự động khởi tạo dữ liệu mẫu cho Câu hỏi thường gặp (FAQ) và Kênh hỗ trợ kỹ thuật (Support Channels)
 * phục vụ màn hình Trợ giúp & Giải đáp thắc mắc (NCL-19-CN-004).
 */
@Component
@Order(20)
@Slf4j
@RequiredArgsConstructor
public class FaqDataInitializer implements CommandLineRunner {

    private final FaqItemRepository faqItemRepository;
    private final SupportChannelRepository supportChannelRepository;

    @Override
    public void run(String... args) {
        try {
            initSupportChannels();
            initFaqItems();
        } catch (Exception e) {
            log.warn("FaqDataInitializer: Bỏ qua khởi tạo dữ liệu FAQ: {}", e.getMessage());
        }
    }

    private void initSupportChannels() {
        if (supportChannelRepository.count() > 0) {
            return;
        }

        List<SupportChannel> channels = Arrays.asList(
                SupportChannel.builder()
                        .channelType(SupportChannelType.HOTLINE)
                        .channelName("Tổng đài hỗ trợ kỹ thuật")
                        .contactValue("1900 6868")
                        .description("Miễn phí cước gọi, tiếp nhận 07:30 - 22:00")
                        .displayOrder(1)
                        .isActive(true)
                        .build(),
                SupportChannel.builder()
                        .channelType(SupportChannelType.ZALO)
                        .channelName("Zalo hỗ trợ kỹ thuật 24/7")
                        .contactValue("0988 123 456")
                        .description("Tiếp nhận hình ảnh lỗi và giải đáp tức thì")
                        .displayOrder(2)
                        .isActive(true)
                        .build(),
                SupportChannel.builder()
                        .channelType(SupportChannelType.EMAIL)
                        .channelName("Hộp thư điện tử hỗ trợ")
                        .contactValue("hotro@banhangviet.vn")
                        .description("Phản hồi chi tiết trong vòng 15 phút")
                        .displayOrder(3)
                        .isActive(true)
                        .build(),
                SupportChannel.builder()
                        .channelType(SupportChannelType.WORKING_HOURS)
                        .channelName("Giờ làm việc bộ phận hỗ trợ")
                        .contactValue("07:30 - 22:00 (Thứ Hai - Chủ Nhật)")
                        .description("Hỗ trợ liên tục tất cả các ngày trong tuần, kể cả ngày lễ")
                        .displayOrder(4)
                        .isActive(true)
                        .build()
        );

        supportChannelRepository.saveAll(channels);
        log.info("FaqDataInitializer: Đã khởi tạo {} kênh hỗ trợ kỹ thuật mặc định.", channels.size());
    }

    private void initFaqItems() {
        if (faqItemRepository.count() > 0) {
            return;
        }

        List<FaqItem> items = Arrays.asList(
                // ==================== NHÓM 1: HÓA ĐƠN & THUẾ (INVOICE) ====================
                FaqItem.builder()
                        .category(FaqCategory.INVOICE)
                        .question("Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?")
                        .answer("Mở màn hình Quản lý hóa đơn điện tử, lọc trạng thái \"Gửi lỗi\" hoặc \"Đang xử lý\". Bạn có thể nhấn nút \"Gửi lại thuế\" để hệ thống tự động truyền lại dữ liệu. Nếu Cơ quan thuế từ chối do sai sót thông tin (như sai MST, sai ký hiệu), hãy xem cột chi tiết lý do từ chối để chỉnh sửa kịp thời.")
                        .actionUrl("/invoices?status=FAILED")
                        .actionLabel("Kiểm tra hóa đơn lỗi")
                        .keywords("hóa đơn treo, hoa don treo, loi hoa don, thue tu choi, gui thue loi, hoa don loi")
                        .displayOrder(1)
                        .viewCount(24L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.INVOICE)
                        .question("Làm thế nào để sửa hoặc điều chỉnh hóa đơn đã cấp mã bị sai sót?")
                        .answer("Với hóa đơn đã được Cơ quan thuế cấp mã nhưng phát hiện sai sót, bạn vào danh sách Hóa đơn, bấm vào dòng hóa đơn cần xử lý và nhấn \"Lập hóa đơn điều chỉnh\" hoặc \"Lập hóa đơn thay thế\" theo quy định của Thông tư 78. Hệ thống sẽ giữ nguyên liên kết với hóa đơn gốc để phục vụ kê khai thuế minh bạch.")
                        .actionUrl("/invoices")
                        .actionLabel("Xem danh sách hóa đơn")
                        .keywords("sua hoa don, dieu chinh hoa don, hoa don sai, thay the hoa don, thong tu 78")
                        .displayOrder(2)
                        .viewCount(18L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.INVOICE)
                        .question("Dải số hóa đơn bị hết số thì cần làm gì để tiếp tục xuất đơn?")
                        .answer("Khi dải số hóa đơn đã dùng hết, hệ thống sẽ chặn xuất đơn mới để tránh sai phạm Thuế. Bạn cần vào mục Cài đặt -> Mẫu hóa đơn để khai báo dải số hóa đơn mới theo ký hiệu mẫu số đã đăng ký thông báo phát hành với Cơ quan thuế.")
                        .actionUrl("/settings/invoice-template")
                        .actionLabel("Khai báo dải số mới")
                        .keywords("het so hoa don, dai so hoa don, ky hieu mau so, het dai so")
                        .displayOrder(3)
                        .viewCount(15L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.INVOICE)
                        .question("Hóa đơn khởi tạo từ máy tính tiền POS được truyền lên thuế khi nào?")
                        .answer("Theo quy định, hóa đơn khởi tạo từ máy tính tiền tại quầy POS sẽ tự động ký số và truyền dữ liệu lên hệ thống Cơ quan Thuế ngay khi kết ca hoặc vào cuối ngày kinh doanh. Bạn có thể chủ động kiểm tra trạng thái tại màn hình Hóa đơn điện tử.")
                        .actionUrl("/invoices")
                        .actionLabel("Kiểm tra trạng thái HĐĐT")
                        .keywords("may tinh tien, truyen thue, hoa don pos, cuoi ngay, truyen du lieu thue")
                        .displayOrder(4)
                        .viewCount(11L)
                        .isActive(true)
                        .build(),

                // ==================== NHÓM 2: BÁN HÀNG & CA (SALES) ====================
                FaqItem.builder()
                        .category(FaqCategory.SALES)
                        .question("Đơn hàng bán xong chưa kịp xuất hóa đơn thì tìm lại ở đâu?")
                        .answer("Bạn vào màn hình Danh sách đơn hàng tại quầy POS, sử dụng bộ lọc \"Chưa xuất hóa đơn\" để tra cứu đơn hàng cần phát hành bổ sung. Bấm trực tiếp vào đơn và nhấn nút \"Phát hành hóa đơn gửi Thuế\" để hoàn tất.")
                        .actionUrl("/orders")
                        .actionLabel("Danh sách đơn hàng")
                        .keywords("tim don hang, don chua xuat hoa don, pos ban hang, hoa don chua xuat")
                        .displayOrder(1)
                        .viewCount(22L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.SALES)
                        .question("Cách xử lý khi khách hàng trả lại hàng đã mua?")
                        .answer("Để xử lý đổi trả hàng, bạn vào mục Bán hàng -> Trả hàng (hoặc phím tắt Trả hàng trên POS), gõ mã hóa đơn cũ hoặc quét mã vạch sản phẩm. Hệ thống sẽ tự động tính số tiền hoàn trả cho khách và cộng bù lại số lượng tồn kho chuẩn xác.")
                        .actionUrl("/return-tickets")
                        .actionLabel("Lập phiếu trả hàng")
                        .keywords("tra hang, doi tra, phieu tra hang, hoan tien, khach tra hang")
                        .displayOrder(2)
                        .viewCount(19L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.SALES)
                        .question("Làm sao để bán hàng tươi sống theo cân ký (thịt, rau củ) tại POS?")
                        .answer("Trong danh mục Hàng hóa, khi khai báo mặt hàng hãy tích chọn ô 'Bán theo trọng lượng'. Khi thanh toán tại quầy POS, cân điện tử kết nối máy tính sẽ tự động truyền số kg vào giỏ hàng, hoặc thu ngân có thể gõ trực tiếp số lẻ (ví dụ: 0.35 kg).")
                        .actionUrl("/products")
                        .actionLabel("Cài đặt hàng theo cân")
                        .keywords("ban theo can, can dien tu, thit rau cu, trong luong, can ky")
                        .displayOrder(3)
                        .viewCount(16L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.SALES)
                        .question("Bị mất mạng Internet có tiếp tục bán hàng tại quầy thu ngân được không?")
                        .answer("Có thể bán hàng bình thường. Hệ thống tích hợp chế độ Offline tự động lưu trữ đơn bán hàng vào bộ nhớ máy tính quầy thu ngân. Khi mạng Internet có trở lại, toàn bộ đơn hàng sẽ tự động đồng bộ lên máy chủ đám mây mà không bị mất dữ liệu.")
                        .actionUrl("/pos")
                        .actionLabel("Mở quầy thu ngân POS")
                        .keywords("mat mang, offline, mat ket noi internet, ban hang offline")
                        .displayOrder(4)
                        .viewCount(14L)
                        .isActive(true)
                        .build(),

                // ==================== NHÓM 3: TÀI KHOẢN & QUYỀN (ACCOUNT) ====================
                FaqItem.builder()
                        .category(FaqCategory.ACCOUNT)
                        .question("Quên mật khẩu đăng nhập hoặc muốn đổi mật khẩu thì làm sao?")
                        .answer("Nếu bạn đang đăng nhập, hãy vào trang Thông tin cá nhân rồi chọn \"Đổi mật khẩu\". Nếu bạn quên mật khẩu ngoài màn hình đăng nhập, hãy nhấn \"Quên mật khẩu\" để nhận mã OTP qua Email hoặc Số điện thoại để đặt lại mật khẩu mới.")
                        .actionUrl("/settings/user-profile")
                        .actionLabel("Đổi mật khẩu ngay")
                        .keywords("quen mat khau, doi mat khau, doi pass, quen pass, reset mat khau, otp")
                        .displayOrder(1)
                        .viewCount(30L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.ACCOUNT)
                        .question("Tài khoản nhân viên thu ngân bị khóa thì mở khóa ở đâu?")
                        .answer("Chỉ chủ hộ kinh doanh mới có quyền mở khóa tài khoản nhân viên. Chủ hộ vào mục Nhân viên -> Quản lý nhân viên, tìm nhân viên đang bị khóa và bấm nút \"Mở khóa tài khoản\".")
                        .actionUrl("/employees")
                        .actionLabel("Quản lý nhân viên")
                        .keywords("khoa tai khoan, mo khoa nhan vien, thu ngan bi khoa, tai khoan bi khoa")
                        .displayOrder(2)
                        .viewCount(12L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.ACCOUNT)
                        .question("Phân quyền cho thu ngân chỉ được tính tiền, không được xem báo cáo doanh thu?")
                        .answer("Hệ thống hỗ trợ phân quyền vai trò chuyên biệt: Vai trò VT-02 (Thu ngân): Chỉ truy cập màn hình bán hàng POS, lập hóa đơn tính tiền và mở/đóng ca. Vai trò VT-01 (Chủ hộ): Xem toàn bộ doanh thu, lợi nhuận và sổ sách báo cáo thuế.")
                        .actionUrl("/employees")
                        .actionLabel("Phân quyền tài khoản")
                        .keywords("phan quyen, an doanh thu, quyen thu ngan, vai tro vt-02")
                        .displayOrder(3)
                        .viewCount(9L)
                        .isActive(true)
                        .build(),

                // ==================== NHÓM 4: DỮ LIỆU & SAO LƯU (DATA) ====================
                FaqItem.builder()
                        .category(FaqCategory.DATA)
                        .question("Dữ liệu của tôi được sao lưu như thế nào và làm sao kiểm tra an toàn?")
                        .answer("Hệ thống tự động sao lưu dữ liệu toàn bộ cửa hàng hàng ngày vào lúc 02:30 sáng lên đám mây mã hóa. Bạn có thể vào mục Cài đặt -> Sao lưu & Khôi phục để xem lịch sử và kết quả chạy thử phục hồi định kỳ của hệ thống.")
                        .actionUrl("/settings/backup-export")
                        .actionLabel("Xem lịch sử sao lưu")
                        .keywords("sao luu du lieu, backup, mat du lieu, an toan du lieu, phuc hoi")
                        .displayOrder(1)
                        .viewCount(17L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.DATA)
                        .question("Cách kiểm tra và đối soát công nợ khách hàng định kỳ?")
                        .answer("Vào phân hệ Khách hàng -> Tab Đối chiếu nợ, chọn khoảng thời gian cần chốt và tên khách hàng để xem chi tiết các phát sinh mua nợ, số tiền đã trả và số dư nợ còn lại. Bấm nút \"In biên bản\" để in giấy xác nhận gửi khách ký tên.")
                        .actionUrl("/customers")
                        .actionLabel("Đối soát công nợ")
                        .keywords("doi soat cong no, cong no khach hang, so no, cong no")
                        .displayOrder(2)
                        .viewCount(14L)
                        .isActive(true)
                        .build(),
                FaqItem.builder()
                        .category(FaqCategory.DATA)
                        .question("Làm sao để xuất file Excel danh sách hàng hóa và giá vốn?")
                        .answer("Tại màn hình Quản lý hàng hóa, nhìn sang góc trên bên phải thanh công cụ và bấm nút \"Xuất file\". Hệ thống sẽ tạo ngay file bảng tính Excel đầy đủ mã SKU, tên hàng, đơn vị tính, tồn kho và giá bán.")
                        .actionUrl("/products")
                        .actionLabel("Danh mục hàng hóa")
                        .keywords("xuat excel, tai file hang hoa, bao cao ton kho, export excel")
                        .displayOrder(3)
                        .viewCount(11L)
                        .isActive(true)
                        .build()
        );

        faqItemRepository.saveAll(items);
        log.info("FaqDataInitializer: Đã khởi tạo {} câu hỏi thường gặp (FAQ) mặc định.", items.size());
    }
}
