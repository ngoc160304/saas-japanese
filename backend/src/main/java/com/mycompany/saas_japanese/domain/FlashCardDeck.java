package com.mycompany.saas_japanese.domain;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
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
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    User createdByUser;
    Instant createdAt;

}
