package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCardDeck;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCardDeck;
import com.mycompany.saas_japanese.domain.response.FlashCardDeckResponse;
import java.util.List;
@Component
public class FlashCardDeckMapper {
    public FlashCardDeck toFlashCardDeck(ReqCreateFlashCardDeck req) {
        FlashCardDeck flashCardDeck = new FlashCardDeck();
        if (req == null) return null;
        flashCardDeck.setTitle(req.getTitle());
        flashCardDeck.setDescription(req.getDescription());
        flashCardDeck.setLevelId(req.getLevelId());
        flashCardDeck.setIsTemplate(req.getIsTemplate());
        if(req.getCreatedByUserId() != null)
        {
            User user = new User();
            user.setId(req.getCreatedByUserId());
            flashCardDeck.setCreatedByUser(user);
        }
        return flashCardDeck;
    }

    public FlashCardDeckResponse toResponse(FlashCardDeck flashCardDeck) {
        FlashCardDeckResponse response = new FlashCardDeckResponse();
        if (flashCardDeck == null) return null;
        response.setDeckId(flashCardDeck.getDeckId());
        response.setTitle(flashCardDeck.getTitle());
        if(flashCardDeck.getCreatedByUser() != null) {
            response.setCreatedByUserId(flashCardDeck.getCreatedByUser().getId());
        }
        response.setDescription(flashCardDeck.getDescription());
        response.setLevelId(flashCardDeck.getLevelId());
        response.setIsTemplate(flashCardDeck.getIsTemplate());
        return response;
    }

    public void updateFlashCardDeck(FlashCardDeck flashCardDeck, ReqUpdateFlashCardDeck req) {
        if (flashCardDeck == null || req == null) return;
        flashCardDeck.setTitle(req.getTitle());
        flashCardDeck.setDescription(req.getDescription());
        flashCardDeck.setLevelId(req.getLevelId());
        flashCardDeck.setIsTemplate(req.getIsTemplate());
    }

    
}
