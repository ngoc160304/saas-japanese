package com.mycompany.saas_japanese.domain;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;


@Entity
@Table(name = "flashcarduserprogress")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PACKAGE)
    public class FlashcardUserProgress {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        Long progressId;

        Long userId;
        @ManyToOne
        @JoinColumn(name = "flashcardId")
        Flashcard flashcard;
        Double easeFactor;
        Integer reviewInterval;
        Integer repetitions;
        Instant nextReviewAt;
        Instant lastReviewedAt;
    }

