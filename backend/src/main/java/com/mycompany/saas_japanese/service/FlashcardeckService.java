package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.repository.FlashcarddeckRepository;
import com.mycompany.saas_japanese.util.error.IdInvalidException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FlashcardeckService {
    FlashcarddeckRepository flashcarddeckRepository;

    public FlashCardDeck createFlashCardDeck(FlashCardDeck flashCardDeckRequest)
    {
        return flashcarddeckRepository.save(flashCardDeckRequest);
    }

    public FlashCardDeck updateFlashCardDeck(Long id, FlashCardDeck deckRequest)throws Exception
    {
        FlashCardDeck deck = flashcarddeckRepository.findById(id)
                .orElseThrow(() -> new IdInvalidException("Flashcard deck not found with id: " + id));

        deck.setTitle(deckRequest.getTitle());
        deck.setDescription(deckRequest.getDescription());
        deck.setLevelId(deckRequest.getLevelId());
        deck.setIsTemplate(deckRequest.getIsTemplate());
        return flashcarddeckRepository.save(deck);
    }

    public List<FlashCardDeck> fetchAllFlashCardDeck()
    {
        return  flashcarddeckRepository.findAll();
    }

    public FlashCardDeck fetchFlashCardDeck(Long id) throws Exception
    {

        return  flashcarddeckRepository.findById(id)
                .orElseThrow(()->new IdInvalidException("flashcard not found"));
    }
    public List<FlashCardDeck> findFlashCarddesk(String title) throws Exception
    {
        List<FlashCardDeck> decks = flashcarddeckRepository.findByTitle(title);
        if(decks.isEmpty()){
            throw new IdInvalidException("No flashcard deck found with title:" + title);
        }
        return decks;
    }


    public void deleteFlashCardDeck(Long id) throws Exception
    {
        FlashCardDeck flashcarddeck = flashcarddeckRepository.findById(id)
                .orElseThrow(()->new IdInvalidException("flashcard not found"));
        flashcarddeckRepository.deleteById(id);
    }


}
