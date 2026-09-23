package com.mycompany.saas_japanese.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttemptPart;

@Repository
public interface UserJlptAttemptPartRepository
        extends JpaRepository<UserJlptAttemptPart, Long> {

    List<UserJlptAttemptPart> findByAttemptSession_IdOrderByJlptExamPart_SortOrderAsc(
            Long attemptSessionId
    );

    @Query("""
            SELECT attemptPart
            FROM UserJlptAttemptPart attemptPart
            JOIN FETCH attemptPart.jlptExamPart examPart
            JOIN attemptPart.attemptSession attemptSession
            WHERE attemptSession.attempt.id = :attemptId
            ORDER BY attemptSession.jlptExamSession.sortOrder, examPart.sortOrder
            """)
    List<UserJlptAttemptPart> findResultPartsByAttemptId(@Param("attemptId") Long attemptId);
}
