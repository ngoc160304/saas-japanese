package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "flashcarddecks")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PACKAGE)
public class FlashCardDeck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long deckId;
    String title;
    @OneToMany(mappedBy = "deck")
    List<Flashcard> flashcards;
    String description;
    Long levelId;
    Boolean isTemplate;
    Long createdByUserId;
    Instant createdAt;

}
