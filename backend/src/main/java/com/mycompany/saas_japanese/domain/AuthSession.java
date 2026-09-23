package com.mycompany.saas_japanese.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "auth_sessions")
@Getter
@Setter
public class AuthSession {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false)
  private Long userId;

  @Column(nullable = false, length = 64)
  private String refreshTokenHash;

  @Column(nullable = false)
  private Instant expiresAt;

  private Instant revokedAt;

  @Column(nullable = false)
  private boolean persistent;
}
