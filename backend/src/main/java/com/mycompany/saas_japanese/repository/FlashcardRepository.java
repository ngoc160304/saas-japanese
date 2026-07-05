package com.mycompany.saas_japanese.repository;

import com.mycompany.saas_japanese.domain.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;



@Repository

public interface FlashcardRepository extends JpaRepository<Flashcard,Long> {

}
