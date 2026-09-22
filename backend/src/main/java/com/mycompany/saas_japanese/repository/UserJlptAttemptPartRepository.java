package com.mycompany.saas_japanese.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttemptPart;

@Repository
public interface UserJlptAttemptPartRepository
        extends JpaRepository<UserJlptAttemptPart, Long> {

    List<UserJlptAttemptPart> findByAttemptSession_IdOrderByJlptExamPart_SortOrderAsc(
            Long attemptSessionId
    );
}