package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.QuizQuestion;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    Optional<QuizQuestion> findByIdAndDeletedAtIsNull(Long id);

    List<QuizQuestion> findByQuizIdAndDeletedAtIsNullOrderBySortOrderAsc(Long quizId);
}