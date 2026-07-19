package com.mycompany.saas_japanese.domain.request;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReqCreateFlashCard {
    @NotNull(message = "Deck ID không được để trống")
    Long deckId;
    @NotBlank(message = "Mặt trước của flashcard không được để trống")
    String frontText;
    @NotBlank(message = "Mặt sau của flashcard không được để trống")
    String backText;
    String audioUrl; 
    String imageUrl;
    Long userId;
}
