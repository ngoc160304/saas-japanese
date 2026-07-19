package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import com.mycompany.saas_japanese.domain.response.FlashcardUserProgressResponse;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class FlashCardUserProgressMapper {

    public FlashcardUserProgressResponse toResponse(FlashcardUserProgress entity) {
        if (entity == null) {
            return null;
        }

        Long flashcardId = null;
        String frontText = null;
        String backText = null;

        
        if (entity.getFlashcard() != null) {
            flashcardId = entity.getFlashcard().getFlashcardId();
            
            frontText = entity.getFlashcard().getFrontText(); 
            backText = entity.getFlashcard().getBackText();
        }

        return FlashcardUserProgressResponse.builder()
                .id(entity.getId())
                .flashcardId(flashcardId)
                .frontText(frontText)
                .backText(backText)
                .repetitions(entity.getRepetitions())
                .nextReviewAt(entity.getNextReviewAt())
                .build();
    }
}
   
