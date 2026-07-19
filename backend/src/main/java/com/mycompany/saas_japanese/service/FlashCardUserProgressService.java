package com.mycompany.saas_japanese.service;

import java.util.List;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.response.FlashcardUserProgressResponse;

public interface FlashCardUserProgressService {
    
    FlashcardUserProgress initProgress(User user, Flashcard flashcard);
    FlashcardUserProgressResponse updateProgress(Long progressId, int quality);
    List<FlashcardUserProgressResponse> fetchCardsToReview(Long userId);
}
