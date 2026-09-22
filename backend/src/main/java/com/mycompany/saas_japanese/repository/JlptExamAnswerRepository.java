package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.JlptExamAnswer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JlptExamAnswerRepository extends JpaRepository<JlptExamAnswer, Long> {
    List<JlptExamAnswer> findByJlptExamQuestionIdOrderBySortOrderAsc(
            Long questionId);
}
