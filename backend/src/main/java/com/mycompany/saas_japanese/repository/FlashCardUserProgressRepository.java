package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface FlashCardUserProgressRepository extends JpaRepository<FlashcardUserProgress,Long> {
    List<FlashcardUserProgress> findByUserIdAndNextReviewAtLessThanEqual(Long userId, Instant now);
}
