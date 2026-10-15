package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExamPart;

@Repository
public interface JlptExamPartRepository
        extends JpaRepository<JlptExamPart, Long> {

    List<JlptExamPart> findByJlptExamSession_IdOrderBySortOrderAsc(Long sessionId);
    List<JlptExamPart> findByJlptExamSessionIdOrderBySortOrderAscIdAsc(Long sessionId);
    boolean existsByAudioMediaId(Long mediaId);

    @Query("""
            SELECT part
            FROM JlptExamPart part
            JOIN FETCH part.jlptExamSession session
            WHERE session.id IN :sessionIds
            ORDER BY session.sortOrder, session.id, part.sortOrder, part.id
            """)
    List<JlptExamPart> findAdminPartsBySessionIds(
            @Param("sessionIds") Collection<Long> sessionIds);

    @Query("""
            SELECT part.jlptExamSession.jlptExam.id as examId,
                count(distinct part.id) as partCount, count(question.id) as questionCount
            FROM JlptExamPart part
            LEFT JOIN part.questions question
            WHERE part.jlptExamSession.jlptExam.id IN :examIds
            GROUP BY part.jlptExamSession.jlptExam.id
            """)
    List<JlptExamContentCounts> countContentByExamIds(@Param("examIds") Collection<Long> examIds);
}
