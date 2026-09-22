package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.UserJlptAttemptAnswer;

@Repository
public interface UserJlptAttemptAnswerRepository
        extends JpaRepository<UserJlptAttemptAnswer, Long> {

    Optional<UserJlptAttemptAnswer> findBySessionAttempt_IdAndJlptExamQuestion_Id(
            Long sessionAttemptId,
            Long questionId);
}