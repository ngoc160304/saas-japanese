package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import com.mycompany.saas_japanese.repository.FlashCardUserProgressRepository;
import com.mycompany.saas_japanese.util.error.IdInvalidException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FlashcardUserProgressService {
    FlashCardUserProgressRepository userProgressRepository;

    public FlashcardUserProgress initProgress(Long userId, Flashcard flashcard) {
        FlashcardUserProgress progress = FlashcardUserProgress.builder()
                .userId(userId)
                .flashcard(flashcard)
                .easeFactor(2.5)
                .reviewInterval(0)
                .repetitions(0)
                .nextReviewAt(Instant.now())
                .build();

        return userProgressRepository.save(progress);
    }


    public FlashcardUserProgress updateProgress(Long progressId, int quality) throws Exception {
        FlashcardUserProgress progress = userProgressRepository.findById(progressId)
                .orElseThrow(() -> new IdInvalidException("Progress record not found"));

        int repetitions = progress.getRepetitions();
        double easeFactor = progress.getEaseFactor();
        int interval;

        if (quality >= 3) {
            if (repetitions == 0) {
                interval = 1;
            } else if (repetitions == 1) {
                interval = 6;
            } else {
                interval = (int) Math.round(progress.getReviewInterval() * easeFactor);
            }
            repetitions++;
        } else {
            repetitions = 0;
            interval = 1;
        }
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (easeFactor < 1.3) {
            easeFactor = 1.3;
        }
        progress.setRepetitions(repetitions);
        progress.setEaseFactor(easeFactor);
        progress.setReviewInterval(interval);

        Instant now = Instant.now();
        progress.setLastReviewedAt(now);
        progress.setNextReviewAt(now.plus(interval, ChronoUnit.DAYS));

        return userProgressRepository.save(progress);
    }

    public List<FlashcardUserProgress> fetchCardsToReview(Long userId) {

        return userProgressRepository.findByUserIdAndNextReviewAtLessThanEqual(userId,Instant.now());
    }
}
