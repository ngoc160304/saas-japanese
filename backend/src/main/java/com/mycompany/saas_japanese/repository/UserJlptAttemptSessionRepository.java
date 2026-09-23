package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttemptSession;

@Repository
public interface UserJlptAttemptSessionRepository
        extends JpaRepository<UserJlptAttemptSession, Long> {

    @EntityGraph(attributePaths = "jlptExamSession")
    List<UserJlptAttemptSession> findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(
            Long attemptId
    );

    Optional<UserJlptAttemptSession> findByIdAndAttemptId(
            Long id,
            Long attemptId);

    @Query("""
            SELECT attemptSession
            FROM UserJlptAttemptSession attemptSession
            JOIN attemptSession.attempt attempt
            JOIN FETCH attemptSession.jlptExamSession examSession
            WHERE attempt.id IN :attemptIds
            ORDER BY attempt.id, examSession.sortOrder
            """)
    List<UserJlptAttemptSession> findHistorySessionsByAttemptIds(
            @Param("attemptIds") List<Long> attemptIds);
}
