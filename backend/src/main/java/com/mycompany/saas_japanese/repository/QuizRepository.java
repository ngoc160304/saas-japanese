package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Quiz;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    Optional<Quiz> findByIdAndDeletedAtIsNull(Long id);

    List<Quiz> findByLessonIdAndDeletedAtIsNull(Long lessonId);

    Optional<Quiz> findByLessonIdAndDeletedAtIsNullAndIsPublishedTrue(Long lessonId);
}
