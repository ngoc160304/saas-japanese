package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.response.RestResponse;
import com.mycompany.saas_japanese.repository.FlashcardRepository;
import com.mycompany.saas_japanese.util.error.IdInvalidException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FlashcardService {
    FlashcardRepository flashcardRepository;

    public Flashcard createFlashCard( Flashcard flashcardRequest)
    {
        return flashcardRepository.save(flashcardRequest);
    }

    public Flashcard updateFlashCard(Long id, Flashcard flashcardRequest)throws Exception{
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(()->new IdInvalidException("flashcard not found"));
        flashcard.setDeck(flashcardRequest.getDeck());
        flashcard.setFrontText(flashcardRequest.getFrontText());
        flashcard.setBackText(flashcardRequest.getBackText());
        flashcard.setImageUrl(flashcardRequest.getImageUrl());
        flashcard.setAudioUrl(flashcardRequest.getAudioUrl());
        return flashcardRepository.save(flashcard);
    }

    public List<Flashcard> fetchAllFlashCard()
    {
        return  flashcardRepository.findAll();
    }

    public Flashcard fetchFlashCard(Long id) throws Exception
    {
        return flashcardRepository.findById(id)
                .orElseThrow(()->new IdInvalidException("flashcard not found"));
    }


    public void deleteFlashCard(Long id) throws Exception
    {
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseThrow(()->new IdInvalidException("flashcard not found"));
        flashcardRepository.deleteById(id);
    }
}
