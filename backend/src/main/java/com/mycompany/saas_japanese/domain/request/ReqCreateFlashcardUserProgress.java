package com.mycompany.saas_japanese.domain.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqCreateFlashcardUserProgress {

    @NotNull(message = "User ID không được để trống")
    Long userId;

    @NotNull(message = "Flashcard ID không được để trống")
    Long flashcardId;

}
