package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.query.FlashCardDeckQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCardDeck;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCardDeck;
import com.mycompany.saas_japanese.domain.response.FlashCardDeckResponse;

public interface FlashCardDeckService {
    FlashCardDeckResponse fetchFlashCardDeckById(long id);
    FlashCardDeckResponse updateFlashCardDeck(long id, ReqUpdateFlashCardDeck requestFlashCardDeck);
    void deleteFlashCardDeck(long id);
    FlashCardDeck handleCreateFlashCardDeck(ReqCreateFlashCardDeck requestFlashCardDeck);
    Page<FlashCardDeckResponse> fetchAllFlashCardDeck(FlashCardDeckQuery query);
}
