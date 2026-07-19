package com.mycompany.saas_japanese.service.impl;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.response.FlashcardUserProgressResponse;
import com.mycompany.saas_japanese.repository.FlashcardUserProgressRepository;
import com.mycompany.saas_japanese.service.FlashCardUserProgressService;
import com.mycompany.saas_japanese.service.mapper.FlashCardUserProgressMapper;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@AllArgsConstructor
public class FCUserProgressServiceImpl implements FlashCardUserProgressService{
    FlashcardUserProgressRepository userProgressRepository;
    FlashCardUserProgressMapper flashCardUserProgressMapper;
    @Override
    public FlashcardUserProgress initProgress(User user, Flashcard flashcard) {
        
        FlashcardUserProgress progress = new FlashcardUserProgress();
                progress.setUser(user);
                progress.setFlashcard(flashcard);
                progress.setEaseFactor(2.5);
                progress.setReviewInterval(0);
                progress.setRepetitions(0);
                progress.setNextReviewAt(Instant.now());
        return progress;
    }
    @Override
    public FlashcardUserProgressResponse updateProgress(Long progressId, int quality) {
         FlashcardUserProgress progress = userProgressRepository.findById(progressId)
                .orElseThrow(() -> new BadRequestException("Progress not found with id: " + progressId));
        int repetitions = progress.getRepetitions();
        double easeFactor = progress.getEaseFactor();
        int interval;
       
        if (quality >= 3) {
            easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (easeFactor < 1.3) {
                easeFactor = 1.3;
            }
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
        progress.setRepetitions(repetitions);
        progress.setEaseFactor(easeFactor);
        progress.setReviewInterval(interval);

        Instant now = Instant.now();
        progress.setLastReviewedAt(now);
        progress.setNextReviewAt(now.plus(interval, ChronoUnit.DAYS));
       FlashcardUserProgress savedProgress = userProgressRepository.save(progress);
        return flashCardUserProgressMapper.toResponse(savedProgress);
    }
    @Override
    public List<FlashcardUserProgressResponse> fetchCardsToReview(Long userId) {
        List<FlashcardUserProgress> entityList = userProgressRepository.findByUserIdAndNextReviewAtLessThanEqual(userId, Instant.now());
    
        List<FlashcardUserProgressResponse> responseList = new ArrayList<>();
    
        for (FlashcardUserProgress entity : entityList) {
        FlashcardUserProgressResponse responseDTO = flashCardUserProgressMapper.toResponse(entity);
        
        
        responseList.add(responseDTO);
    }
    
    return responseList;
    
    
    }
}
