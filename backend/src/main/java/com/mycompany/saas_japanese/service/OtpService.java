package com.mycompany.saas_japanese.service;

import com.mycompany.saas_japanese.domain.Otp;

public interface OtpService {
  Otp save(Otp otp);
  Otp getLatestOtp(String email);
}
