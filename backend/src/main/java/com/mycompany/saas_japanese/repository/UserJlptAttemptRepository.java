package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttempt;

@Repository
public interface UserJlptAttemptRepository
        extends JpaRepository<UserJlptAttempt, Long> {

    Optional<UserJlptAttempt> findByIdAndUser_Id(
            Long id,
            Long userId);
}