package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Vocabulary;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VocabularyRepository
    extends JpaRepository<Vocabulary, Long>,
    JpaSpecificationExecutor<Vocabulary> {

  Optional<Vocabulary> findByIdAndDeletedAtIsNull(Long id);
}
