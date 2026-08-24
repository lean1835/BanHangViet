package com.sales.service;

import com.sales.dto.request.ActivityLogFilterRequest;
import com.sales.dto.response.ActivityLogResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AuditLogIntegrationTest {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private User owner;

    @BeforeEach
    void setUp() {
        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));

        BusinessHousehold household = businessHouseholdRepository.findAll().stream().findFirst()
                .orElseGet(() -> businessHouseholdRepository.save(BusinessHousehold.builder()
                        .name("Test Household")
                        .taxCode("0123456789")
                        .phoneNumber("0901234567")
                        .address("123 Test Street")
                        .representativeName("Nguyen Van A")
                        .build()));

        owner = userRepository.findByUsername("test_owner_integration")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_owner_integration")
                        .passwordHash("encoded_pass")
                        .fullName("Test Owner")
                        .role(ownerRole)
                        .household(household)
                        .isActive(true)
                        .build()));
    }

    @Test
    @DisplayName("Test getAuditLogs real database query with null filters")
    void testGetAuditLogsRealDb() {
        ActivityLogFilterRequest filter = ActivityLogFilterRequest.builder()
                .page(0)
                .size(15)
                .build();

        PageResponse<ActivityLogResponse> response = auditLogService.getAuditLogs(
                owner.getUsername(),
                filter,
                "127.0.0.1",
                "Mozilla/5.0"
        );

        assertNotNull(response);
        assertNotNull(response.getContent());
    }

    @Test
    @DisplayName("Test repairLegacyHashChain handles legacy unhashed records and restores full integrity")
    void testRepairLegacyHashChain() {
        // Insert legacy unindexed / unhashed log records
        com.sales.entity.ActivityLog legacy1 = com.sales.entity.ActivityLog.builder()
                .household(owner.getHousehold())
                .user(owner)
                .action("LEGACY_ACTION_1")
                .targetTable("orders")
                .targetId("ord-001")
                .oldValue(null)
                .newValue("{\"status\":\"DONE\"}")
                .sequenceNumber(null)
                .previousHash(null)
                .hash(null)
                .build();

        com.sales.entity.ActivityLog legacy2 = com.sales.entity.ActivityLog.builder()
                .household(owner.getHousehold())
                .user(owner)
                .action("LEGACY_ACTION_2")
                .targetTable("orders")
                .targetId("ord-002")
                .oldValue(null)
                .newValue("{\"status\":\"PAID\"}")
                .sequenceNumber(null)
                .previousHash(null)
                .hash(null)
                .build();

        activityLogRepository.saveAndFlush(legacy1);
        activityLogRepository.saveAndFlush(legacy2);

        // Run repair
        auditLogService.repairLegacyHashChain();

        // Verify integrity
        com.sales.dto.response.AuditIntegrityResponse integrity = auditLogService.verifyIntegrity(owner.getUsername());
        assertNotNull(integrity);
        assertTrue(integrity.isValid(), "Chuỗi Hash Chain phải hợp lệ sau khi chuẩn hóa migration");
        assertTrue(integrity.getTotalRecordsChecked() >= 2);
    }
}
