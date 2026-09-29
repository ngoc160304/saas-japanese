package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExamQuestion;

@Repository
public interface JlptExamQuestionRepository
        extends JpaRepository<JlptExamQuestion, Long> {

    List<JlptExamQuestion> findByJlptExamPartIdOrderBySortOrderAsc(
            Long examPartId);

    long countByJlptExamPart_Id(Long partId);

    @Query("""
            SELECT question
            FROM JlptExamQuestion question
            JOIN FETCH question.jlptExamPart part
            WHERE part.id IN :partIds
            ORDER BY part.sortOrder, question.sortOrder
            """)
    List<JlptExamQuestion> findAdminQuestionsByPartIds(
            @Param("partIds") Collection<Long> partIds);

    @Query("""
            SELECT question
            FROM UserJlptAttemptPart attemptPart
            JOIN attemptPart.jlptExamPart examPart
            JOIN examPart.questions question
            JOIN FETCH question.jlptExamPart questionPart
            JOIN FETCH questionPart.jlptExamSession examSession
            WHERE attemptPart.attemptSession.attempt.id = :attemptId
            ORDER BY examSession.sortOrder, questionPart.sortOrder, question.sortOrder
            """)
    List<JlptExamQuestion> findReviewQuestionsByAttemptId(@Param("attemptId") Long attemptId);

}
