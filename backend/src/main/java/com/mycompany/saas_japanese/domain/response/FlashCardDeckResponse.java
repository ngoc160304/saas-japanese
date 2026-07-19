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
public class FlashCardDeckResponse {
    Long deckId;
    String title;
    String description;
    Long levelId;
    Boolean isTemplate;
    Long createdByUserId;
    Instant createdAt;
}
