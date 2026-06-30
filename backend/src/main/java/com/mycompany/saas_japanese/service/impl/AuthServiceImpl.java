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
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.provider.BrevoProvider;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.service.OtpService;
import com.mycompany.saas_japanese.util.error.BadRequestException;

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
  public String verifyUser(ReqOtpDTO otp) {
    throw new UnsupportedOperationException("Unimplemented method 'verifyUser'");
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

    String accessToken = this.generateToken(userDetails, Duration.ofMinutes(30).getSeconds(),
        userDetails.getUsername());
    String refreshToken = this.generateToken(userDetails, Duration.ofDays(7).getSeconds(), userDetails.getUsername());
    ResLoginDTO.UserLogin userLogin = new ResLoginDTO.UserLogin(
        user.getEmail(),
        user.getUsername(),
        user.getId());

    ResLoginDTO response = new ResLoginDTO();
    response.setAccessToken(accessToken);
    response.setRefreshToen(refreshToken);
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
}
