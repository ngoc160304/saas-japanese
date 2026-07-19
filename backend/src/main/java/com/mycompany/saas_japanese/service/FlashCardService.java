package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.query.FlashCardQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCard;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCard;
import com.mycompany.saas_japanese.domain.response.FlashCardResponse;
public interface FlashCardService {
    Flashcard handleCreateFlashCard(ReqCreateFlashCard requestFlashCard);
    FlashCardResponse fetchFlashCardById(long id);
    FlashCardResponse updateFlashCard(long id, ReqUpdateFlashCard requestFlashCard);
    void deleteFlashCard(long id);
    Page<FlashCardResponse> fetchAllFlashCard(FlashCardQuery query);

}
