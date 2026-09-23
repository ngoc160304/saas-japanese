package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.QuizOption;

@Repository
public interface QuizOptionRepository extends JpaRepository<QuizOption, Long> {

    Optional<QuizOption> findById(Long id);

    List<QuizOption> findByQuestionIdOrderBySortOrderAsc(Long questionId);
}
