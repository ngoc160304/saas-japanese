package com.mycompany.saas_japanese.controller;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqRegisterDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqUpdateProfileDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.domain.response.ResRegisterDTO;
import com.mycompany.saas_japanese.domain.response.UserProfileResponseDTO;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.service.AuthTokens;
import com.mycompany.saas_japanese.service.UserService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private static final String COOKIE_NAME = "refresh_token";
  private static final String COOKIE_PATH = "/api/v1/auth";
  private final AuthService authService;
  private final UserService userService;
  private final boolean secureCookie;

  public AuthController(AuthService authService, UserService userService,
      @Value("${AUTH_COOKIE_SECURE:true}") boolean secureCookie) {
    this.authService = authService;
    this.userService = userService;
    this.secureCookie = secureCookie;
  }

  @GetMapping("/csrf")
  public ResponseEntity<Map<String, String>> csrf(CsrfToken token) {
    return ResponseEntity.ok().header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(Map.of("token", token.getToken(), "headerName", token.getHeaderName()));
  }

  @PostMapping("/register")
  @ApiMessage("register")
  public ResponseEntity<ResRegisterDTO> register(@Valid @RequestBody ReqRegisterDTO request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
  }

  @PostMapping("/login")
  @ApiMessage("login")
  public ResponseEntity<ResLoginDTO> login(@Valid @RequestBody ReqLoginDTO request) {
    return tokenResponse(authService.login(request));
  }

  @PostMapping("/refresh-token")
  @ApiMessage("refresh token")
  public ResponseEntity<ResLoginDTO> refreshToken(
      @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
    return tokenResponse(authService.refreshToken(refreshToken));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(@CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
    authService.logout(refreshToken);
    return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE,
        cookie("", COOKIE_PATH).maxAge(Duration.ZERO).build().toString(),
        cookie("", "/").maxAge(Duration.ZERO).build().toString())
        .header(HttpHeaders.CACHE_CONTROL, "no-store").build();
  }

  @PostMapping("/verify-user")
  @ApiMessage("verify user")
  public ResponseEntity<String> verifyUser(@Valid @RequestBody ReqOtpDTO request) {
    return ResponseEntity.ok(authService.verifyUser(request));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<String> forgotPassword(@Valid @RequestBody ReqForgotPasswordDTO request) {
    authService.forgotPassword(request);
    return ResponseEntity.ok("Send otp success");
  }

  @PostMapping("/verify-reset-otp")
  public ResponseEntity<String> verifyResetOtp(@Valid @RequestBody ReqOtpDTO request) {
    authService.verifyResetOtp(request);
    return ResponseEntity.ok("OTP verified");
  }

  @PostMapping("/reset-password")
  public ResponseEntity<String> resetPassword(@Valid @RequestBody ReqResetPasswordDTO request) {
    authService.resetPassword(request);
    return ResponseEntity.ok("Reset password success");
  }

  @GetMapping("/myProfile")
  @ApiMessage("get my profile")
  public ResponseEntity<UserProfileResponseDTO> getMyProfile() {
    return ResponseEntity.ok(userService.getMyProfile());
  }

  @PostMapping("/updateProfile")
  @ApiMessage("update profile")
  public ResponseEntity<UserProfileResponseDTO> updateProfile(@Valid @RequestBody ReqUpdateProfileDTO request) {
    return ResponseEntity.ok(userService.updateMyProfile(request));
  }

  private ResponseEntity<ResLoginDTO> tokenResponse(AuthTokens tokens) {
    ResponseCookie.ResponseCookieBuilder builder = cookie(tokens.refreshToken(), COOKIE_PATH);
    if (tokens.persistent()) {
      builder.maxAge(Math.max(0, Duration.between(Instant.now(), tokens.refreshExpiresAt()).getSeconds()));
    }
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, builder.build().toString(),
            cookie("", "/").maxAge(Duration.ZERO).build().toString())
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(tokens.response());
  }

  private ResponseCookie.ResponseCookieBuilder cookie(String value, String path) {
    return ResponseCookie.from(COOKIE_NAME, value).httpOnly(true).secure(secureCookie).sameSite("Lax").path(path);
  }
}
