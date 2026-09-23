package com.mycompany.saas_japanese.service.impl;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.Otp;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqRegisterDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.response.ResRegisterDTO;
import com.mycompany.saas_japanese.provider.BrevoProvider;
import com.mycompany.saas_japanese.repository.OtpRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.service.AuthTokenService;
import com.mycompany.saas_japanese.service.AuthTokens;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.ConflictException;
import com.mycompany.saas_japanese.util.error.ForbiddenException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
  private static final SecureRandom RANDOM = new SecureRandom();
  private final UserRepository userRepository;
  private final OtpRepository otpRepository;
  private final PasswordEncoder passwordEncoder;
  private final BrevoProvider brevoProvider;
  private final AuthenticationManager authenticationManager;
  private final AuthTokenService tokens;

  @Override
  @Transactional
  public ResRegisterDTO register(ReqRegisterDTO request) {
    String email = normalizeEmail(request.getEmail());
    if (userRepository.existsByEmail(email)) {
      throw new ConflictException("Email is already registered");
    }
    User user = new User();
    user.setEmail(email);
    user.setUsername(request.getFullName().trim());
    user.setPhone(request.getPhone());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setActive(true);
    user.setVerified(false);
    userRepository.save(user);
    String code = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
    Otp otp = new Otp();
    otp.setEmail(email);
    otp.setOtp(code);
    otpRepository.save(otp);
    brevoProvider.sendOtpEmail(email, user.getUsername(), code);
    return new ResRegisterDTO(email, "VERIFY_EMAIL");
  }

  @Override
  @Transactional
  public String verifyUser(ReqOtpDTO request) {
    String email = normalizeEmail(request.getEmail());
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BadRequestException("Invalid verification request"));
    if (!user.isActive() || user.isVerified()) {
      throw new BadRequestException("Invalid verification request");
    }
    Otp otp = otpRepository.findFirstByEmailOrderByCreatedAtDesc(email);
    if (otp == null || otp.isUsed() || otp.getExpiredAt() == null
        || !otp.getExpiredAt().isAfter(Instant.now()) || !otp.getOtp().equals(request.getOtp())) {
      throw new BadRequestException("Invalid or expired verification code");
    }
    user.setVerified(true);
    userRepository.save(user);
    otp.setUsed(true);
    otpRepository.save(otp);
    return "Verify success";
  }

  @Override
  public AuthTokens login(ReqLoginDTO request) {
    String email = normalizeEmail(request.getEmail());
    authenticationManager.authenticate(
        UsernamePasswordAuthenticationToken.unauthenticated(email, request.getPassword()));
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
    if (!user.isActive() || !user.isVerified()) {
      throw new ForbiddenException("Account is inactive or email is not verified");
    }
    return tokens.create(user, request.isRememberMe());
  }

  @Override
  public AuthTokens refreshToken(String refreshToken) {
    return tokens.refresh(refreshToken);
  }

  @Override
  public void logout(String refreshToken) {
    tokens.revoke(refreshToken);
  }

  // Recovery is fail-closed until a purpose-bound, single-use reset grant is implemented.
  @Override
  public void forgotPassword(ReqForgotPasswordDTO request) {
    throw new ForbiddenException("Password recovery is unavailable");
  }

  @Override
  public void verifyResetOtp(ReqOtpDTO request) {
    throw new ForbiddenException("Password recovery is unavailable");
  }

  @Override
  public void resetPassword(ReqResetPasswordDTO request) {
    throw new ForbiddenException("Password recovery is unavailable");
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }
}
