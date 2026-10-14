package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository
    extends JpaRepository<Vocabulary, Long>,
    JpaSpecificationExecutor<Vocabulary> {

  List<Vocabulary> findAllByLessonIdAndDeletedAtIsNull(Long lessonId);
  
  Optional<Vocabulary> findByIdAndDeletedAtIsNull(Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select item from Vocabulary item where item.id = :id and item.deletedAt is null")
  Optional<Vocabulary> findActiveForUpdate(@Param("id") Long id);
}
