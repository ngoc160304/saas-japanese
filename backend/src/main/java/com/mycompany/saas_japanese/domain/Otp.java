package com.mycompany.saas_japanese.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "otps")
public class Otp {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String email;

  @Column(nullable = false, length = 6)
  private String otp;

  @Column(nullable = false)
  private Instant expiredAt; // 5 minutes

  @Column(nullable = false)
  private boolean used;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;

  @PrePersist
  public void prePersist() {
    createdAt = Instant.now();
    updatedAt = createdAt;
    expiredAt = createdAt.plusSeconds(300);
    used = false;
  }

  @PreUpdate
  public void preUpdate() {
    updatedAt = Instant.now();
  }
}
