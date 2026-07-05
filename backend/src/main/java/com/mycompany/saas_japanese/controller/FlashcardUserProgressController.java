package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.domain.Flashcard;
import com.mycompany.saas_japanese.domain.FlashcardUserProgress;
import com.mycompany.saas_japanese.domain.response.RestResponse;
import com.mycompany.saas_japanese.service.FlashcardUserProgressService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FlashcardUserProgressController {

    FlashcardUserProgressService userProgressService;


    @PostMapping("/user-progress/init")
    public RestResponse<FlashcardUserProgress> initProgress(
            @RequestParam("userId") Long userId, @RequestBody Flashcard flashcard) {
        return RestResponse.<FlashcardUserProgress>builder()
                .statusCode(201)
                .message("Initialize flashcard progress successfully")
                .data(userProgressService.initProgress(userId,flashcard))
                .build();
    }

    @PutMapping("/user-progress/{progressId}/quality/{quality}")
    public RestResponse<FlashcardUserProgress> updateProgress(
            @PathVariable("progressId") Long progressId,
            @PathVariable("quality") int quality) throws Exception {

        return RestResponse.<FlashcardUserProgress>builder()
                .statusCode(200)
                .message("Update flashcard progress successfully")
                .data(userProgressService.updateProgress(progressId,quality))
                .build();
    }
    @GetMapping("/user-progress/user/{userId}/review")
    public RestResponse<List<FlashcardUserProgress>> fetchCardsToReview(@PathVariable("userId") Long userId)
            throws Exception
    {
        return RestResponse.<List<FlashcardUserProgress>>builder()
                .statusCode(200)
                .message("fetch Card to review successfully")
                .data(userProgressService.fetchCardsToReview(userId))
                .build();
    }
}
