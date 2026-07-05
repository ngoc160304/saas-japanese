package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.response.RestResponse;
import com.mycompany.saas_japanese.service.FlashcardService;
import com.mycompany.saas_japanese.service.FlashcardeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FlashcardController {
    FlashcardService flashcardService;

    @GetMapping("/flashcards")
    public RestResponse<List<Flashcard>> fetchAllFlashCard()
    {
        return RestResponse.<List<Flashcard>>builder()
                .statusCode(200)
                .data(flashcardService.fetchAllFlashCard())
                .build();
    }

    @PostMapping("/flashcards")
    public RestResponse<Flashcard> createFlashCard(@RequestBody Flashcard flashcardRequest)
    {
        return RestResponse.<Flashcard>builder()
                .statusCode(201)
                .data(flashcardService.createFlashCard(flashcardRequest))
                .build();
    }

    @PutMapping("/flashcards/{id}")
    public RestResponse<Flashcard> updateFlashCard( @PathVariable("id") Long id ,@RequestBody Flashcard flashcardRequest) throws Exception
    {

        return RestResponse.<Flashcard>builder()
                .statusCode(200)
                .data(flashcardService.updateFlashCard(id,flashcardRequest))
                .build();
    }
    @GetMapping("/flashcards/{id}")
    public RestResponse<Flashcard> fetchFlashCard(@PathVariable("id") Long id) throws Exception
    {
        return RestResponse.<Flashcard>builder()
                .statusCode(200)
                .data(flashcardService.fetchFlashCard(id))
                .build();
    }
    @DeleteMapping("/flashcards/{id}")
    public RestResponse<String> deleteFlashCard(@PathVariable("id") Long id) throws Exception
    {
        flashcardService.deleteFlashCard(id);
        return RestResponse.<String>builder()
                .statusCode(200)
                .message("flash card has id : "+ id + " deleted succesfully")
                .build();
    }




}
