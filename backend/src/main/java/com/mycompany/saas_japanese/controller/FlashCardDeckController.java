package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.response.RestResponse;
import com.mycompany.saas_japanese.service.FlashcardeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class FlashCardDeckController {
    FlashcardeckService flashcardeckService;


    @GetMapping("/flashcarddecks")
    public RestResponse<List<FlashCardDeck>> fetchAllFlashCardDeck()
    {
        return RestResponse.<List<FlashCardDeck>>builder()
                .statusCode(200)
                .data(flashcardeckService.fetchAllFlashCardDeck())
                .build();
    }

    @PostMapping("/flashcarddecks")
    public RestResponse<FlashCardDeck> createFlashCardDeck(@RequestBody FlashCardDeck flashCardDeckRequest)
    {
        return RestResponse.<FlashCardDeck>builder()
                .statusCode(201)
                .data(flashcardeckService.createFlashCardDeck(flashCardDeckRequest))
                .build();
    }

    @PutMapping("/flashcarddecks/{id}")
    public RestResponse<FlashCardDeck> updateFlashCardDeck( @PathVariable("id") Long id ,@RequestBody FlashCardDeck flashcarddeckRequest) throws Exception
    {

        return RestResponse.<FlashCardDeck>builder()
                .statusCode(200)
                .data(flashcardeckService.updateFlashCardDeck(id,flashcarddeckRequest))
                .build();
    }
    @GetMapping("/flashcarddecks/{id}")
    public RestResponse<FlashCardDeck> fetchFlashCardDeck(@PathVariable("id") Long id) throws Exception
    {
        return RestResponse.<FlashCardDeck>builder()
                .statusCode(200)
                .data(flashcardeckService.fetchFlashCardDeck(id))
                .build();
    }
    @DeleteMapping("/flashcarddecks/{id}")
    public RestResponse<String> deleteFlashCardDeck(@PathVariable("id") Long id) throws Exception
    {
        flashcardeckService.deleteFlashCardDeck(id);
        return RestResponse.<String>builder()
                .statusCode(200)
                .message("flash card deck has id : "+ id + " deleted succesfully")
                .build();
    }

}
