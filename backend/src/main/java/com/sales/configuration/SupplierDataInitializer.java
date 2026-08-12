package com.sales.configuration;

import com.sales.entity.Supplier;
import com.sales.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SupplierDataInitializer implements CommandLineRunner {

    private final SupplierRepository supplierRepository;

    @Override
    public void run(String... args) throws Exception {
        if (supplierRepository.count() > 0) {
            log.info("Dữ liệu nhà cung cấp đã tồn tại trong Database, bỏ qua khởi tạo.");
            return;
        }

        log.info("Bắt đầu khởi tạo dữ liệu mẫu nhà cung cấp vào Database...");

        List<Supplier> mockSuppliers = Arrays.asList(
                Supplier.builder()
                        .code("NCC0003")
                        .name("Công ty Pharmedic")
                        .phone("0908123456")
                        .email("contact@pharmedic.vn")
                        .address("345 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh")
                        .taxCode("0109876543")
                        .groupName("Hóa mỹ phẩm - Tiêu dùng")
                        .companyName("Công ty Cổ phần Pharmedic")
                        .notes("Nhà cung cấp dược mỹ phẩm")
                        .currentDebt(BigDecimal.ZERO)
                        .totalPurchase(BigDecimal.ZERO)
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC0004")
                        .name("Đại lý Hồng Phúc")
                        .phone("0913987654")
                        .email("hongphuc.daily@gmail.com")
                        .address("12 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh")
                        .taxCode("0309876543")
                        .groupName("Bánh kẹo - Nước giải khát")
                        .companyName("Đại lý Hồng Phúc")
                        .notes("Đại lý phân phối nước giải khát")
                        .currentDebt(BigDecimal.ZERO)
                        .totalPurchase(BigDecimal.ZERO)
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC0005")
                        .name("Cửa hàng Đại Việt")
                        .phone("0937554433")
                        .email("daiviet.store@gmail.com")
                        .address("56 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh")
                        .taxCode("0809876543")
                        .groupName("Thiết bị - Gia dụng")
                        .companyName("Cửa hàng Đại Việt")
                        .notes("Gia dụng và thiết bị cửa hàng")
                        .currentDebt(BigDecimal.ZERO)
                        .totalPurchase(BigDecimal.ZERO)
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC0001")
                        .name("Công ty TNHH Citigo")
                        .phone("0901234567")
                        .email("info@citigo.com")
                        .address("Tầng 6, Tòa nhà Citigo, Quận Cầu Giấy, Hà Nội")
                        .taxCode("0101234567")
                        .groupName("Thiết bị - Gia dụng")
                        .companyName("Công ty TNHH Citigo Software")
                        .notes("Đối tác phần mềm KiotViet & phần cứng POS")
                        .currentDebt(BigDecimal.ZERO)
                        .totalPurchase(BigDecimal.ZERO)
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC0002")
                        .name("Công ty Hoàng Gia")
                        .phone("0988776655")
                        .email("hoanggia.corp@gmail.com")
                        .address("89 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh")
                        .taxCode("0301234567")
                        .groupName("Nông sản - Thực phẩm")
                        .companyName("Công ty Cổ phần Hoàng Gia")
                        .notes("Thực phẩm đóng gói Hoàng Gia")
                        .currentDebt(BigDecimal.ZERO)
                        .totalPurchase(BigDecimal.ZERO)
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC00001")
                        .name("Công ty TNHH Nông Sản Việt Nam")
                        .phone("0912345678")
                        .email("nongsanviet@gmail.com")
                        .address("123 Đường Lê Lợi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh")
                        .taxCode("0102030405")
                        .groupName("Nông sản - Thực phẩm")
                        .companyName("Công ty TNHH Nông Sản Việt Nam")
                        .notes("Giao hàng mỗi sáng thứ 2, 4, 6. Chiết khấu 2% cho đơn > 10 triệu.")
                        .currentDebt(new BigDecimal("15500000"))
                        .totalPurchase(new BigDecimal("85000000"))
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC00002")
                        .name("Đại lý Bánh Kẹo & Nước Giải Khát Minh Phát")
                        .phone("0987654321")
                        .email("minhphat.candy@yahoo.com")
                        .address("456 Quốc lộ 1A, Phường 10, Q. Tân Bình, TP. Hồ Chí Minh")
                        .taxCode("0304050607")
                        .groupName("Bánh kẹo - Nước giải khát")
                        .companyName("DNTN Minh Phát")
                        .notes("Nợ gối đầu 15 ngày.")
                        .currentDebt(BigDecimal.ZERO)
                        .totalPurchase(new BigDecimal("42000000"))
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC00003")
                        .name("Nhà Phân Phối Hàng Tiêu Dùng Phú Thái")
                        .phone("0903112233")
                        .email("phuthai.distributor@gmail.com")
                        .address("78 Đường 3/2, Phường 12, Quận 10, TP. Hồ Chí Minh")
                        .taxCode("0809101112")
                        .groupName("Hóa mỹ phẩm - Tiêu dùng")
                        .companyName("Tập đoàn Phú Thái")
                        .notes("Nhà cung cấp hóa chất & hóa mỹ phẩm uy tín.")
                        .currentDebt(new BigDecimal("8200000"))
                        .totalPurchase(new BigDecimal("31500000"))
                        .status("ACTIVE")
                        .build(),

                Supplier.builder()
                        .code("NCC00004")
                        .name("Cơ sở Sản xuất Đồ Khô Tấn Tài")
                        .phone("0934556677")
                        .email("dokhotantai@gmail.com")
                        .address("Chợ Bình Tây, Phường 2, Quận 6, TP. Hồ Chí Minh")
                        .taxCode("1122334455")
                        .groupName("Nông sản - Thực phẩm")
                        .companyName("Cơ sở Tấn Tài")
                        .notes("Chuyên hải sản khô, tôm khô, mực khô.")
                        .currentDebt(new BigDecimal("2400000"))
                        .totalPurchase(new BigDecimal("18000000"))
                        .status("INACTIVE")
                        .build()
        );

        supplierRepository.saveAll(mockSuppliers);
        log.info("Tải thành công {} nhà cung cấp mẫu vào Database!", mockSuppliers.size());
    }
}
