package com.viet.sales.repository;

import com.viet.sales.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);

    @EntityGraph(attributePaths = {"role", "household"})
    Optional<User> findByUsername(String username);
}
