package com.mycompany.saas_japanese.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import com.mycompany.saas_japanese.domain.Quiz;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    Optional<Quiz> findByIdAndDeletedAtIsNull(Long id);

    List<Quiz> findByLessonIdAndDeletedAtIsNull(Long lessonId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select q from Quiz q where q.lesson.id = :lessonId and q.deletedAt is null order by q.id")
    List<Quiz> findActiveForUpdate(@Param("lessonId") Long lessonId);

    Optional<Quiz> findByLessonIdAndDeletedAtIsNullAndIsPublishedTrue(Long lessonId);
}
