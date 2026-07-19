package com.mycompany.saas_japanese.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.FlashcardUserProgress;

@Repository
public interface FlashcardUserProgressRepository extends JpaRepository<FlashcardUserProgress, Long> {
    @Query("SELECT f FROM FlashcardUserProgress f WHERE f.user.id = :userId AND f.nextReviewAt <= :now")
    List<FlashcardUserProgress> findByUserIdAndNextReviewAtLessThanEqual(
        @Param("userId") Long userId, 
        @Param("now") Instant now
    );
}
