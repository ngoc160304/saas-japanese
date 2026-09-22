package com.mycompany.saas_japanese.repository;

import java.lang.StackWalker.Option;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.JlptExamQuestion;

@Repository
public interface JlptExamQuestionRepository
        extends JpaRepository<JlptExamQuestion, Long> {

    List<JlptExamQuestion> findByJlptExamPartIdOrderBySortOrderAsc(
            Long examPartId);

    long countByJlptExamPart_Id(Long partId);

}