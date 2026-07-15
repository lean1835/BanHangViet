package com.viet.sales.configuration;

import com.viet.sales.entity.Role;
import com.viet.sales.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        seedRoles();
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            List<Role> roles = Arrays.asList(
                Role.builder()
                    .id("1")
                    .code("VT-01")
                    .name("Chủ hộ kinh doanh")
                    .description("Người đứng tên hộ kinh doanh, quản lý toàn bộ hoạt động bán hàng và hóa đơn của cửa hàng.")
                    .build(),
                Role.builder()
                    .id("2")
                    .code("VT-02")
                    .name("Nhân viên bán hàng")
                    .description("Người trực tiếp bán hàng và tính tiền tại điểm bán.")
                    .build(),
                Role.builder()
                    .id("3")
                    .code("VT-03")
                    .name("Kế toán")
                    .description("Người phụ trách tra cứu, điều chỉnh hóa đơn và lập báo cáo, thường là kế toán thuê ngoài.")
                    .build(),
                Role.builder()
                    .id("4")
                    .code("VT-04")
                    .name("Quản trị nền tảng")
                    .description("Người vận hành nền tảng phần mềm cung cấp dịch vụ cho nhiều hộ kinh doanh.")
                    .build(),
                Role.builder()
                    .id("5")
                    .code("VT-05")
                    .name("Cơ quan thuế mô phỏng")
                    .description("Thành phần mô phỏng vai trò cơ quan thuế tiếp nhận và cấp mã hóa đơn trong phạm vi đồ án.")
                    .build(),
                Role.builder()
                    .id("6")
                    .code("VT-06")
                    .name("Khách hàng")
                    .description("Người mua hàng nhận hóa đơn điện tử từ cửa hàng.")
                    .build()
            );
            roleRepository.saveAll(roles);
        }
    }
}
