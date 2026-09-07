package com.sales.repository;

import com.sales.entity.User;
import com.sales.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, String>, JpaSpecificationExecutor<UserSession> {

    @Query("SELECT s FROM UserSession s LEFT JOIN FETCH s.household WHERE s.id = :sessionId")
    Optional<UserSession> findByIdWithHousehold(@Param("sessionId") String sessionId);

    @Query("SELECT s FROM UserSession s JOIN FETCH s.user u JOIN FETCH u.role WHERE s.household.id = :householdId AND s.isRevoked = false ORDER BY s.lastActiveAt DESC")
    List<UserSession> findActiveSessionsByHouseholdId(@Param("householdId") String householdId);

    @Query("SELECT s FROM UserSession s JOIN FETCH s.user u JOIN FETCH u.role WHERE s.household.id = :householdId ORDER BY s.lastActiveAt DESC")
    List<UserSession> findAllSessionsByHouseholdId(@Param("householdId") String householdId);

    @Query("SELECT s FROM UserSession s JOIN FETCH s.user u JOIN FETCH u.role WHERE s.user.id = :userId AND s.isRevoked = false ORDER BY s.lastActiveAt DESC")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") String userId);

    @Query("SELECT s FROM UserSession s JOIN FETCH s.user u JOIN FETCH u.role WHERE s.user.id = :userId ORDER BY s.lastActiveAt DESC")
    List<UserSession> findAllSessionsByUserId(@Param("userId") String userId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE UserSession s SET s.isRevoked = true, s.revokedAt = :revokedAt, s.revokedByUser = :revokedBy, s.revokeReason = :reason WHERE s.user.id = :userId AND s.isRevoked = false")
    int revokeAllActiveSessionsForUser(@Param("userId") String userId,
                                      @Param("revokedAt") LocalDateTime revokedAt,
                                      @Param("revokedBy") User revokedBy,
                                      @Param("reason") String reason);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE UserSession s SET s.isRevoked = true, s.revokedAt = :revokedAt, s.revokedByUser = :revokedBy, s.revokeReason = :reason WHERE s.user.id = :userId AND s.id <> :excludeSessionId AND s.isRevoked = false")
    int revokeOtherActiveSessionsForUser(@Param("userId") String userId,
                                        @Param("excludeSessionId") String excludeSessionId,
                                        @Param("revokedAt") LocalDateTime revokedAt,
                                        @Param("revokedBy") User revokedBy,
                                        @Param("reason") String reason);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE UserSession s SET s.lastActiveAt = :lastActiveAt WHERE s.id = :sessionId")
    void updateLastActiveAt(@Param("sessionId") String sessionId, @Param("lastActiveAt") LocalDateTime lastActiveAt);
}
