package com.mycompany.saas_japanese.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttemptSession;

@Repository
public interface UserJlptAttemptSessionRepository
        extends JpaRepository<UserJlptAttemptSession, Long> {

    List<UserJlptAttemptSession> findByAttempt_IdOrderByJlptExamSession_SortOrderAsc(
            Long attemptId
    );
}