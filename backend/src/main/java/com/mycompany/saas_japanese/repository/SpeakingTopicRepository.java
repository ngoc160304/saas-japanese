package com.mycompany.saas_japanese.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.mycompany.saas_japanese.domain.SpeakingTopic;

public interface SpeakingTopicRepository extends JpaRepository<SpeakingTopic, Long> {
  Page<SpeakingTopic> findByIsPublishedTrueAndIsDeletedFalse(Pageable pageable);
}

