package com.mycompany.saas_japanese.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.query.FlashCardDeckQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCardDeck;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCardDeck;
import com.mycompany.saas_japanese.domain.response.FlashCardDeckResponse;
import com.mycompany.saas_japanese.repository.FlashCardDeckRepository;
import com.mycompany.saas_japanese.service.FlashCardDeckService;
import com.mycompany.saas_japanese.service.mapper.FlashCardDeckMapper;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@AllArgsConstructor
public class FCDeckServiceImpl implements FlashCardDeckService {
    FlashCardDeckRepository flashCardDeckRepository;
    FlashCardDeckMapper flashCardDeckMapper;
    @Override
    public FlashCardDeckResponse fetchFlashCardDeckById(long id) {
        FlashCardDeck flashCardDeck = flashCardDeckRepository.findById(id)
        .orElseThrow(() -> new BadRequestException("FlashCardDeck not found with id: " + id));
        return flashCardDeckMapper.toResponse(flashCardDeck);
    }

    @Override
    public FlashCardDeckResponse updateFlashCardDeck(long id, ReqUpdateFlashCardDeck requestFlashCardDeck) {
        FlashCardDeck flashCardDeck = flashCardDeckRepository.findById(id)
        .orElseThrow(() -> new BadRequestException("FlashCardDeck not found with id: " + id));
        flashCardDeckMapper.updateFlashCardDeck(flashCardDeck, requestFlashCardDeck);
        FlashCardDeck updatedFlashCardDeck = flashCardDeckRepository.save(flashCardDeck);
        return flashCardDeckMapper.toResponse(updatedFlashCardDeck);
    }
    
    @Override
    public void deleteFlashCardDeck(long id) {
        FlashCardDeck flashCardDeck = flashCardDeckRepository.findById(id)
        .orElseThrow(() -> new BadRequestException("FlashCardDeck not found with id: " + id));
        flashCardDeckRepository.delete(flashCardDeck);
    }

    @Override
    public FlashCardDeck handleCreateFlashCardDeck(ReqCreateFlashCardDeck requestFlashCardDeck) {
       FlashCardDeck flashCardDeck = flashCardDeckMapper.toFlashCardDeck(requestFlashCardDeck);
        return flashCardDeckRepository.save(flashCardDeck);
    }

    @Override
    public Page<FlashCardDeckResponse> fetchAllFlashCardDeck(FlashCardDeckQuery query) {
        Pageable pageable = PageRequest.of(query.getPage(), query.getSize());
        Page<FlashCardDeck> flashCardDecks = flashCardDeckRepository.findAll(pageable);
        return flashCardDecks.map(fcd -> flashCardDeckMapper.toResponse(fcd));
        
    }
    

    
}
