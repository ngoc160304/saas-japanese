package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExam;

@Repository 
public interface JlptExamRepository extends JpaRepository<JlptExam,Long>,JpaSpecificationExecutor<JlptExam> {
    Optional<JlptExam> findByIdAndIsDeletedFalse(Long id);
    
}
