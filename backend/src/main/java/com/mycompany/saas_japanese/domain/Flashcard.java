package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "flashcards")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
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
