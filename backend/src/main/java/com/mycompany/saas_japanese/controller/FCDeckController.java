package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.query.FlashCardDeckQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCardDeck;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCardDeck;
import com.mycompany.saas_japanese.domain.response.FlashCardDeckResponse;
import com.mycompany.saas_japanese.service.FlashCardDeckService;
import com.mycompany.saas_japanese.service.impl.FCDeckServiceImpl;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@RestController
public class FCDeckController {
    FCDeckServiceImpl flashCardDeckServiceImpl;

    @PostMapping("flashcarddecks")
    @ApiMessage("Create a new flashcard deck")
    public ResponseEntity<FlashCardDeck> createDeck(@RequestBody ReqCreateFlashCardDeck request) {
        FlashCardDeck response = flashCardDeckServiceImpl.handleCreateFlashCardDeck(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("flashcarddecks/{id}")
    @ApiMessage("Get flashcard deck by ID")
    public ResponseEntity<FlashCardDeckResponse> getDeckById(@PathVariable("id") long id) {
        FlashCardDeckResponse response = flashCardDeckServiceImpl.fetchFlashCardDeckById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("flashcarddecks/{id}")
    @ApiMessage("Update flashcard deck")
    public ResponseEntity<FlashCardDeckResponse> updateDeck(
            @PathVariable("id") long id, 
            @RequestBody ReqUpdateFlashCardDeck request) {
        FlashCardDeckResponse response = flashCardDeckServiceImpl.updateFlashCardDeck(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("flashcarddecks/{id}")
    @ApiMessage("Delete flashcard deck by ID")
    public ResponseEntity<Void> deleteDeck(@PathVariable("id") long id) {
        flashCardDeckServiceImpl.deleteFlashCardDeck(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("flashcarddecks")
    @ApiMessage("Get all flashcard decks")
    public ResponseEntity<Page<FlashCardDeckResponse>> getAllDecks(FlashCardDeckQuery query) {
        Page<FlashCardDeckResponse> response = flashCardDeckServiceImpl.fetchAllFlashCardDeck(query);
        return ResponseEntity.ok(response);
    }
}
