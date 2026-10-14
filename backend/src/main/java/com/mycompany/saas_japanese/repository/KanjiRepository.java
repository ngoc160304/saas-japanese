package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Kanji;

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
public interface KanjiRepository
    extends JpaRepository<Kanji, Long>,
    JpaSpecificationExecutor<Kanji> {

  Optional<Kanji> findByIdAndDeletedAtIsNull(Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select item from Kanji item where item.id = :id and item.deletedAt is null")
  Optional<Kanji> findActiveForUpdate(@Param("id") Long id);

  boolean existsByKanjiAndDeletedAtIsNull(String kanji);

  boolean existsByKanjiAndIdNotAndDeletedAtIsNull(String kanji, Long id);

  List<Kanji> findAllByLessonIdAndDeletedAtIsNull(Long lessonId);
}
