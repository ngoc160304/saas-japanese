package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.FlashCardDeck;
import com.mycompany.saas_japanese.domain.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcarddeckRepository extends JpaRepository<FlashCardDeck,Long>{
    List<FlashCardDeck> findByTitle(String title);
}
