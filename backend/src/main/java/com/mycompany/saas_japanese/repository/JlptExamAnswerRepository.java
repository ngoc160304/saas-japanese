package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.JlptExamAnswer;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface JlptExamAnswerRepository extends JpaRepository<JlptExamAnswer, Long> {
    List<JlptExamAnswer> findByJlptExamQuestionIdOrderBySortOrderAsc(
            Long questionId);

    @Query("""
            SELECT answer
            FROM JlptExamAnswer answer
            JOIN FETCH answer.jlptExamQuestion question
            WHERE question.id IN :questionIds
            ORDER BY question.sortOrder, answer.sortOrder
            """)
    List<JlptExamAnswer> findReviewAnswersByQuestionIds(
            @Param("questionIds") List<Long> questionIds);
}
