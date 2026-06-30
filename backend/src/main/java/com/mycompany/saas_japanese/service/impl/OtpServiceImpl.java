package com.mycompany.saas_japanese.service.impl;

import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Otp;
import com.mycompany.saas_japanese.repository.OtpRepository;
import com.mycompany.saas_japanese.service.OtpService;

@Service
public class OtpServiceImpl implements OtpService {
  private final OtpRepository otpRepository;

  OtpServiceImpl(OtpRepository otpRepository) {
    this.otpRepository = otpRepository;
  }

  @Override
  public Otp save(Otp otp) {
    return otpRepository.save(otp); // Replace with actual implementation
  }

}
