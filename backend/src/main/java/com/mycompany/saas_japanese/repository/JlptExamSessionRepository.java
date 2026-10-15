package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExamSession;

@Repository
public interface JlptExamSessionRepository
        extends JpaRepository<JlptExamSession, Long>,
        JpaSpecificationExecutor<JlptExamSession> {
                
    
       List<JlptExamSession> findByJlptExam_IdOrderBySortOrderAsc(Long examId);

       List<JlptExamSession> findByJlptExamIdOrderBySortOrderAscIdAsc(Long examId);

       @Query("""
               SELECT session.jlptExam.id as examId, count(session) as sessionCount,
                   coalesce(sum(session.timeLimitMinutes), 0L) as totalTimeMinutes
               FROM JlptExamSession session
               WHERE session.jlptExam.id IN :examIds
               GROUP BY session.jlptExam.id
               """)
       List<JlptExamSessionStatistics> summarizeByExamIds(@Param("examIds") Collection<Long> examIds);

       List<JlptExamSession> findByJlptExam_IdInOrderByJlptExam_IdAscSortOrderAsc(
               Collection<Long> examIds);
}
