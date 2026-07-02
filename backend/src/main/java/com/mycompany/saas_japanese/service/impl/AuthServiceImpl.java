package com.mycompany.saas_japanese.service.impl;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.stereotype.Service;

import com.mycompany.saas_japanese.domain.Otp;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.provider.BrevoProvider;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.service.OtpService;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthServiceImpl implements AuthService {
  private final UserRepository userRepository;
  private final OtpService otpService;
  private final PasswordEncoder passwordEncoder;
  private final BrevoProvider brevoProvider;
  private final AuthenticationManagerBuilder authenticationManagerBuilder;
  private final JwtEncoder jwtEncoder;

  private static final SecureRandom RANDOM = new SecureRandom();

  AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, OtpService otpService,
      BrevoProvider brevoProvider, AuthenticationManagerBuilder authenticationManagerBuilder, JwtEncoder jwtEncoder) {
    this.userRepository = userRepository;
    this.otpService = otpService;
    this.passwordEncoder = passwordEncoder;
    this.brevoProvider = brevoProvider;
    this.authenticationManagerBuilder = authenticationManagerBuilder;
    this.jwtEncoder = jwtEncoder;
  }

  @Override
  public User register(User user) {
    User existUser = userRepository.findByEmail(user.getEmail()).orElse(null);
    if (existUser != null && !existUser.isActive()) {
      throw new BadRequestException("Forbidden");
    }
    if (existUser != null && existUser.isVerified()) {
      throw new BadRequestException("Email already exists");
    } else if (existUser != null && !existUser.isVerified()) {
      String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
      Otp newOtp = new Otp();
      newOtp.setEmail(existUser.getEmail());
      newOtp.setOtp((otp));
      otpService.save(newOtp);
      brevoProvider.sendOtpEmail(existUser.getEmail(), existUser.getUsername(), otp);
      return existUser;
    } else {
      user.setPassword(passwordEncoder.encode(user.getPassword()));
      user.setUsername(user.getEmail().substring(0, user.getEmail().indexOf("@")));
      User newUser = userRepository.save(user);
      String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
      Otp newOtp = new Otp();
      newOtp.setEmail(newUser.getEmail());
      newOtp.setOtp((otp));
      otpService.save(newOtp);
      brevoProvider.sendOtpEmail(newUser.getEmail(), newUser.getUsername(), otp);
      return newUser;
    }

  }

  @Override
  public String verifyUser(ReqOtpDTO req) {

    Otp latestOtp = validateOtp(req.getEmail(), req.getOtp());
    User user = userRepository.findByEmail(req.getEmail())
        .orElseThrow(() -> new BadRequestException("User not found"));
    user.setVerified(true);
    user.setActive(true);
    userRepository.save(user);
    latestOtp.setUsed(true);
    otpService.save(latestOtp);
    return "Verify success";
  }

  private Otp validateOtp(String email, String otpInput) {

    Otp latestOtp = otpService.getLatestOtp(email);

    if (latestOtp == null) {
      throw new BadRequestException("OTP không tồn tại");
    }
    if (latestOtp.isUsed()) {
      throw new BadRequestException("OTP đã được sử dụng");
    }
    if (latestOtp.getExpiredAt() != null &&
        latestOtp.getExpiredAt().isBefore(Instant.now())) {
      throw new BadRequestException("OTP đã hết hạn");
    }
    if (!latestOtp.getOtp().equals(otpInput)) {
      throw new BadRequestException("OTP không đúng");
    }
    return latestOtp;
  }

  @Override
  public ResLoginDTO login(ReqLoginDTO reqLoginDTO) {
    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
        reqLoginDTO.getEmail(), reqLoginDTO.getPassword());

    // xác thực người dùng => cần viết hàm loadUserByUsername
    Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
    SecurityContextHolder.getContext().setAuthentication(authentication);

    UserDetails userDetails = (UserDetails) authentication.getPrincipal();

    User user = userRepository
        .findByEmail(userDetails.getUsername())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    if (!user.isVerified()) {
      throw new BadRequestException("Please verify your email before login");
    }

    String accessToken = this.generateToken(userDetails, Duration.ofMinutes(30).getSeconds(),
        userDetails.getUsername());
    String refreshToken = this.generateToken(userDetails, Duration.ofDays(7).getSeconds(), userDetails.getUsername());
    ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
        user.getEmail(),
        user.getUsername(),
        user.getId());

    ResLoginDTO response = new ResLoginDTO();
    response.setAccessToken(accessToken);
    response.setRefreshToken(refreshToken);
    response.setUser(userLogin);

    return response;
  }

  public String generateToken(UserDetails userDetails, long expiration, String authentication) {
    Instant now = Instant.now();
    Instant validity = now.plus(expiration, ChronoUnit.SECONDS);
    List<String> listAuthority = new ArrayList<String>();
    listAuthority.add("ROLE_USER_CREATE");
    listAuthority.add("ROLE_USER_UPDATE");
    JwtClaimsSet claims = JwtClaimsSet.builder()
        .issuedAt(now)
        .expiresAt(validity)
        .subject(authentication)
        .claim("user",
            userDetails)
        .claim("permission", listAuthority)
        .build();

    return jwtEncoder.encode(
        JwtEncoderParameters.from(claims))
        .getTokenValue();
  }

  @Override
  public void logout(HttpServletResponse response) {
    Cookie cookie = new Cookie("refresh_token", null);
    cookie.setHttpOnly(true);
    cookie.setPath("/");
    cookie.setMaxAge(0);
    response.addCookie((cookie));
  }

  @Override
  public void forgotPassword(ReqForgotPasswordDTO req) {
    User user = userRepository.findByEmail(req.getEmail())
        .orElseThrow(() -> new BadRequestException("Email không tồn tại"));
    String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
    Otp newOtp = new Otp();
    newOtp.setEmail(user.getEmail());
    newOtp.setOtp((otp));
    otpService.save(newOtp);
    brevoProvider.sendOtpEmail(user.getEmail(), user.getUsername(), otp);
  }

  @Override
  public void resetPassword(ReqResetPasswordDTO req) {
    validateOtp(req.getEmail(), req.getOtp());
    User user = userRepository.findByEmail(req.getEmail())
        .orElseThrow(() -> new BadRequestException("Email không tồn tại"));
    user.setPassword(passwordEncoder.encode(req.getNewPassword()));
    userRepository.save(user);
    Otp latestOtp = otpService.getLatestOtp(req.getEmail());
    latestOtp.setUsed(true);
    otpService.save(latestOtp);
  }
}
