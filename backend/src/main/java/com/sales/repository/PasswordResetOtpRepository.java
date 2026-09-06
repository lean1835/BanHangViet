package com.sales.repository;

import com.sales.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, String> {
    Optional<PasswordResetOtp> findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(String phoneNumber);
    Optional<PasswordResetOtp> findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc(String phoneNumber, String type);
    Optional<PasswordResetOtp> findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(String userId);
    Optional<PasswordResetOtp> findTopByUserIdAndTypeAndIsUsedFalseOrderByCreatedAtDesc(String userId, String type);
    Optional<PasswordResetOtp> findTopByUserIdAndPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(String userId, String phoneNumber);
    Optional<PasswordResetOtp> findTopByUserIdAndPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc(String userId, String phoneNumber, String type);
    Optional<PasswordResetOtp> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
    Optional<PasswordResetOtp> findTopByPhoneNumberAndTypeOrderByCreatedAtDesc(String phoneNumber, String type);
    Optional<PasswordResetOtp> findTopByUserIdOrderByCreatedAtDesc(String userId);
    Optional<PasswordResetOtp> findTopByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE PasswordResetOtp o SET o.isUsed = true WHERE o.phoneNumber = :phoneNumber AND o.isUsed = false")
    void invalidateAllPendingOtps(@Param("phoneNumber") String phoneNumber);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE PasswordResetOtp o SET o.isUsed = true WHERE o.phoneNumber = :phoneNumber AND o.type = :type AND o.isUsed = false")
    void invalidateAllPendingOtps(@Param("phoneNumber") String phoneNumber, @Param("type") String type);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE PasswordResetOtp o SET o.isUsed = true WHERE o.user.id = :userId AND o.isUsed = false")
    void invalidateAllPendingOtpsForUser(@Param("userId") String userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE PasswordResetOtp o SET o.isUsed = true WHERE o.user.id = :userId AND o.type = :type AND o.isUsed = false")
    void invalidateAllPendingOtpsForUser(@Param("userId") String userId, @Param("type") String type);
}
