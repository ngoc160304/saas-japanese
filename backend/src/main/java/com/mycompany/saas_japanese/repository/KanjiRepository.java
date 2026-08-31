package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Kanji;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KanjiRepository
    extends JpaRepository<Kanji, Long>,
    JpaSpecificationExecutor<Kanji> {

  Optional<Kanji> findByIdAndDeletedAtIsNull(Long id);

  boolean existsByKanjiAndDeletedAtIsNull(String kanji);
}
