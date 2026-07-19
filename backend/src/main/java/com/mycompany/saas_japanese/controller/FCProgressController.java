package com.mycompany.saas_japanese.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.response.FlashcardUserProgressResponse;
import com.mycompany.saas_japanese.service.impl.FCUserProgressServiceImpl;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@RestController
public class FCProgressController {
    FCUserProgressServiceImpl flashCardUserProgressServiceImpl;

    @GetMapping("FLCProgress/review")
    @ApiMessage("Get all flashcards to review for a user")
    public ResponseEntity<List<FlashcardUserProgressResponse>> getCardsToReview(@Valid @RequestParam Long userId) {
        List<FlashcardUserProgressResponse> response = flashCardUserProgressServiceImpl.fetchCardsToReview(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("FLCProgress/{progressId}/update")
    @ApiMessage("Update flashcard progress for a user")
    public ResponseEntity<FlashcardUserProgressResponse> updateProgress(
            @Valid
            @PathVariable Long progressId,
            @RequestParam int quality) {
        FlashcardUserProgressResponse response = flashCardUserProgressServiceImpl.updateProgress(progressId, quality);
        return ResponseEntity.ok(response);
    }
}
