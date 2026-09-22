package com.mycompany.saas_japanese.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExamSession;

@Repository
public interface JlptExamSessionRepository
        extends JpaRepository<JlptExamSession, Long>,
        JpaSpecificationExecutor<JlptExamSession> {
                
    
       List<JlptExamSession> findByJlptExam_IdOrderBySortOrderAsc(Long examId);
}
