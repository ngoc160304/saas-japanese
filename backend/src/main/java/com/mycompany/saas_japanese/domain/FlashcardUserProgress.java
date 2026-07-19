package com.mycompany.saas_japanese.domain;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
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
        Long id;
        @OneToOne
        @JoinColumn(name = "user_id", referencedColumnName = "id")
        User user;
        @ManyToOne
        @JoinColumn(name = "flashcardId")
        Flashcard flashcard;
        Double easeFactor;
        Integer reviewInterval;
        Integer repetitions;
        Instant nextReviewAt;
        Instant lastReviewedAt;
    }

