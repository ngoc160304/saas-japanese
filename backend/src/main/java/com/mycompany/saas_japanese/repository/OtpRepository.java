package com.mycompany.saas_japanese.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import com.mycompany.saas_japanese.domain.Otp;
import jakarta.persistence.LockModeType;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Otp findFirstByEmailOrderByCreatedAtDesc(String email);
}
