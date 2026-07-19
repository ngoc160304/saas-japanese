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

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.query.FlashCardQuery;
import com.mycompany.saas_japanese.domain.request.ReqCreateFlashCard;
import com.mycompany.saas_japanese.domain.request.ReqUpdateFlashCard;
import com.mycompany.saas_japanese.domain.response.FlashCardResponse;
import com.mycompany.saas_japanese.service.impl.FlashCardServiceImpl;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@RestController
public class FlashCardController {
    FlashCardServiceImpl flashCardServiceImpl;

   @PostMapping("flashcards")
   @ApiMessage("Create a new flashcard")
    public ResponseEntity<Flashcard> createFlashcard(@Valid @RequestBody ReqCreateFlashCard request) {
        Flashcard response = flashCardServiceImpl.handleCreateFlashCard(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("flashcards/{id}")
    @ApiMessage("Get flashcard by ID")
    public ResponseEntity<FlashCardResponse> getFlashcardById(@PathVariable("id") long id) {
        FlashCardResponse response = flashCardServiceImpl.fetchFlashCardById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("flashcards/{id}")
    @ApiMessage("Updateflashcard")
    public ResponseEntity<FlashCardResponse> updateFlashcard(
            @Valid
            @PathVariable("id") long id, 
            @RequestBody ReqUpdateFlashCard request) {
        FlashCardResponse response = flashCardServiceImpl.updateFlashCard(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("flashcards/{id}")
    @ApiMessage("Delete flashcard by ID")
    public ResponseEntity<String> deleteFlashcard(@PathVariable("id") long id) {
        flashCardServiceImpl.deleteFlashCard(id);
        return ResponseEntity.ok("Xoa thanh cong");
    }

    @GetMapping("flashcards")
    @ApiMessage("Get all flashcards")
    public ResponseEntity<Page<FlashCardResponse>> getAllFlashcards(@Valid FlashCardQuery query) {
        Page<FlashCardResponse> response = flashCardServiceImpl.fetchAllFlashCard(query);
        return ResponseEntity.ok(response);
    }
}

