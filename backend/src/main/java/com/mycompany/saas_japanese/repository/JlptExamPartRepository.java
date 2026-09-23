package com.mycompany.saas_japanese.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExamPart;

@Repository
public interface JlptExamPartRepository
        extends JpaRepository<JlptExamPart, Long> {

    List<JlptExamPart> findByJlptExamSession_IdOrderBySortOrderAsc(Long sessionId);
}
