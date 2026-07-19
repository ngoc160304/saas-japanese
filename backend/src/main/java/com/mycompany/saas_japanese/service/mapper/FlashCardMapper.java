package com.mycompany.saas_japanese.service.mapper;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCard;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCard;
import com.mycompany.saas_japanese.domain.response.FlashCardResponse;


import org.springframework.stereotype.Component;

@Component
public class FlashCardMapper {
    public Flashcard toFlashCard(ReqCreateFlashCard req) {
        Flashcard flashcard = new Flashcard();
        if (req == null) return null;
        flashcard.setFrontText(req.getFrontText());
        flashcard.setBackText(req.getBackText());
        flashcard.setAudioUrl(req.getAudioUrl());
        flashcard.setImageUrl(req.getImageUrl());
        return flashcard;
    }
    public FlashCardResponse toResponse(Flashcard flashCard) {
        FlashCardResponse response = new FlashCardResponse();
        if (flashCard == null) return null;
        response.setFlashcardId(flashCard.getFlashcardId());
        response.setFrontText(flashCard.getFrontText());
        response.setBackText(flashCard.getBackText());
        response.setAudioUrl(flashCard.getAudioUrl());
        response.setImageUrl(flashCard.getImageUrl());
        return response;
    }
    public void updateFlashCard(Flashcard flashCard, ReqUpdateFlashCard req) {
        if (flashCard == null || req == null) return;
        flashCard.setFrontText(req.getFrontText());
        flashCard.setBackText(req.getBackText());
        flashCard.setAudioUrl(req.getAudioUrl());
        flashCard.setImageUrl(req.getImageUrl());
    }

    
}
