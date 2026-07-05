package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PACKAGE)
public class Flashcard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long flashcardId;
    @ManyToOne
    @JoinColumn(name = "deckId")
    FlashCardDeck deck;
    @OneToMany(mappedBy = "flashcard")
    List<FlashcardUserProgress>  flashcardUserProgresses;
    String frontText;
    String backText;
    String audioUrl;
    String imageUrl;
    Instant createdAt;




}
