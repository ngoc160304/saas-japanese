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

    @Query("""
            SELECT part
            FROM JlptExamPart part
            JOIN FETCH part.jlptExamSession session
            WHERE session.id IN :sessionIds
            ORDER BY session.sortOrder, part.sortOrder
            """)
    List<JlptExamPart> findAdminPartsBySessionIds(
            @Param("sessionIds") Collection<Long> sessionIds);
}
