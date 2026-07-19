package com.mycompany.saas_japanese.domain.response;

import java.time.Instant;
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
public class FlashCardResponse {
    Long flashcardId;
    String frontText;
    String backText;
    String audioUrl;
    String imageUrl;
    Instant createdAt;
    Long deckId; 
}
