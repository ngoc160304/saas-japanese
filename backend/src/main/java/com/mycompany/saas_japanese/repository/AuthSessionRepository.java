package com.mycompany.saas_japanese.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mycompany.saas_japanese.domain.AuthSession;
import jakarta.persistence.LockModeType;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select session from AuthSession session where session.id = :id")
  Optional<AuthSession> findForUpdate(@Param("id") String id);
}
