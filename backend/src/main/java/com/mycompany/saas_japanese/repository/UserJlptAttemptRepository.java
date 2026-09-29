package com.mycompany.saas_japanese.repository;

import java.util.Optional;
import java.util.Collection;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttempt;

import jakarta.persistence.LockModeType;

@Repository
public interface UserJlptAttemptRepository
        extends JpaRepository<UserJlptAttempt, Long> {

    boolean existsByJlptExam_Id(Long examId);

    @Query("""
            SELECT DISTINCT attempt.jlptExam.id
            FROM UserJlptAttempt attempt
            WHERE attempt.jlptExam.id IN :examIds
            """)
    Set<Long> findAttemptedExamIds(@Param("examIds") Collection<Long> examIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<UserJlptAttempt> findByIdAndUser_Id(
            Long id,
            Long userId);

    @Query("""
            SELECT attempt
            FROM UserJlptAttempt attempt
            JOIN FETCH attempt.jlptExam
            WHERE attempt.id = :attemptId
              AND attempt.user.id = :userId
            """)
    Optional<UserJlptAttempt> findResultByIdAndUserId(
            @Param("attemptId") Long attemptId,
            @Param("userId") Long userId);

    @EntityGraph(attributePaths = "jlptExam")
    @Query("""
            SELECT attempt
            FROM UserJlptAttempt attempt
            WHERE attempt.user.id = :userId
            """)
    Page<UserJlptAttempt> findHistoryByUserId(
            @Param("userId") Long userId,
            Pageable pageable);
}
