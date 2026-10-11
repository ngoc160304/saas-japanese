package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Media;
import jakarta.persistence.LockModeType;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
  Optional<Media> findByIdAndIsDeletedFalse(Long id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select media from Media media where media.id = :id and media.isDeleted = false")
  Optional<Media> findActiveForUpdate(@Param("id") Long id);
}
