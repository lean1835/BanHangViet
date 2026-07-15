package com.viet.sales.service.classes;

import com.viet.sales.dto.request.LoginRequest;
import com.viet.sales.dto.request.RegisterRequest;
import com.viet.sales.dto.response.LoginResponse;
import com.viet.sales.dto.response.RegisterResponse;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.BusinessHouseholdRepository;
import com.viet.sales.repository.RoleRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.AuthService;
import com.viet.sales.service.interfaces.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final BusinessHouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 1. Kiểm tra mã số thuế trùng lặp
        if (householdRepository.existsByTaxCode(request.getTaxCode())) {
            throw new AppException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
        }

        // 2. Kiểm tra tên đăng nhập trùng lặp
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        // 3. Tìm vai trò "Chủ hộ kinh doanh" (VT-01)
        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        // 4. Lưu thông tin hộ kinh doanh
        BusinessHousehold household = BusinessHousehold.builder()
                .name(request.getHouseholdName())
                .taxCode(request.getTaxCode())
                .address(request.getHouseholdAddress())
                .phoneNumber(request.getHouseholdPhone())
                .representativeName(request.getFullName())
                .revenueThresholdEnabled(false)
                .build();
        
        household = householdRepository.save(household);

        // 5. Lưu thông tin tài khoản admin của hộ
        User ownerUser = User.builder()
                .household(household)
                .role(ownerRole)
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhone() != null ? request.getPhone() : request.getHouseholdPhone())
                .isActive(true)
                .build();

        ownerUser = userRepository.save(ownerUser);

        // 6. Trả về thông tin đăng ký thành công
        return RegisterResponse.builder()
                .householdId(household.getId())
                .taxCode(household.getTaxCode())
                .householdName(household.getName())
                .householdAddress(household.getAddress())
                .householdPhone(household.getPhoneNumber())
                .userId(ownerUser.getId())
                .username(ownerUser.getUsername())
                .fullName(ownerUser.getFullName())
                .roleCode(ownerRole.getCode())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 1. Tìm người dùng theo username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 2. Kiểm tra tài khoản có đang hoạt động hay không (NCL-01-CN-002-TC-03)
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        // 3. Kiểm tra mật khẩu (NCL-01-CN-002-TC-02)
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        // 4. Tạo JWT token
        String token = jwtService.generateToken(user);

        // 5. Trả về LoginResponse
        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .roleCode(user.getRole().getCode())
                .householdId(user.getHousehold() != null ? user.getHousehold().getId() : null)
                .build();
    }
}
