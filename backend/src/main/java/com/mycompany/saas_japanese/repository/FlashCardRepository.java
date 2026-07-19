package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Flashcard;


@Repository
public interface FlashCardRepository extends JpaRepository<Flashcard, Long>{

}
