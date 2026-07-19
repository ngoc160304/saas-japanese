package com.mycompany.saas_japanese.service.impl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.query.FlashCardQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCard;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCard;
import com.mycompany.saas_japanese.domain.response.FlashCardResponse;
import com.mycompany.saas_japanese.service.FlashCardService;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.repository.FlashCardRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.mapper.FlashCardMapper;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import jakarta.transaction.Transactional;

import com.mycompany.saas_japanese.repository.FlashcardUserProgressRepository;
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@AllArgsConstructor
public class FlashCardServiceImpl implements FlashCardService {

    FlashCardMapper flashCardMapper;
    FlashCardRepository flashCardRepository;
    UserRepository userRepository;
    FCUserProgressServiceImpl fcUserProgressServiceImpl;
    FlashcardUserProgressRepository userProgressRepository;
    @Override
    @Transactional
    public Flashcard handleCreateFlashCard(ReqCreateFlashCard requestFlashCard) {
        
    Flashcard flashCard = flashCardMapper.toFlashCard(requestFlashCard);
    User user = userRepository.findById(requestFlashCard.getUserId())
        .orElseThrow(() -> new RuntimeException("User not found with id: " + requestFlashCard.getUserId()));
    Flashcard savedFlashcard = flashCardRepository.save(flashCard);
    
    FlashcardUserProgress progress = fcUserProgressServiceImpl.initProgress(user, savedFlashcard);
    
    userProgressRepository.save(progress);
    
    return savedFlashcard;
    }

    @Override
    public FlashCardResponse fetchFlashCardById(long id) {
        Flashcard flashCard = flashCardRepository.findById(id).orElseThrow(() -> new BadRequestException("Flashcard not found with id: " + id));
        return flashCardMapper.toResponse(flashCard);
    }

    @Override
    public FlashCardResponse updateFlashCard(long id, ReqUpdateFlashCard requestFlashCard) {
        Flashcard flashCard = flashCardRepository.findById(id).orElseThrow(() -> new BadRequestException("Flashcard not found with id: " + id));
        flashCardMapper.updateFlashCard(flashCard, requestFlashCard);
        Flashcard updatedFlashCard = flashCardRepository.save(flashCard);
        return flashCardMapper.toResponse(updatedFlashCard);
    }

    @Override
    public void deleteFlashCard(long id) {
        Flashcard flashCard = flashCardRepository.findById(id).orElseThrow(() -> new BadRequestException("Flashcard not found with id: " + id));
        flashCardRepository.delete(flashCard);
    }

    @Override
    public Page<FlashCardResponse> fetchAllFlashCard(FlashCardQuery query) {
        Pageable pageable = PageRequest.of(query.getPage(), query.getSize());
        Page<Flashcard> flashCards = flashCardRepository.findAll(pageable);
        return flashCards.map(fc->flashCardMapper.toResponse(fc));
    }
    


}
