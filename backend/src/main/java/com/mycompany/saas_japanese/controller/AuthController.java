package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.repository.OtpRepository;
import com.mycompany.saas_japanese.service.impl.UserServiceImpl;
import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqUpdateProfileDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.domain.response.UserProfileResponseDTO;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.service.impl.OtpServiceImpl;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import kong.unirest.HttpStatus;
import jakarta.servlet.http.Cookie;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final UserServiceImpl userServiceImpl;
  private final OtpRepository otpRepository;
  private final AuthService authService;

  AuthController(AuthService authService, OtpRepository otpRepository, UserServiceImpl userServiceImpl) {
    this.authService = authService;
    this.otpRepository = otpRepository;
    this.userServiceImpl = userServiceImpl;
  }

  @PostMapping("/register")
  @ApiMessage("register")
  public ResponseEntity<User> createdNewCourses(@RequestBody User postUser) {
    User user = this.authService.register(postUser);
    return ResponseEntity.status(HttpStatus.CREATED).body(user);
  }

  @PostMapping("/login")
  @ApiMessage("login")
  public ResponseEntity<ResLoginDTO> login(@Valid @RequestBody ReqLoginDTO postUser) {
    ResLoginDTO res = this.authService.login(postUser);
    ResponseCookie resCookies = ResponseCookie.from("refresh_token",
        res.getRefreshToken())
        .httpOnly(true)
        .secure(true) // chi duoc su dung voi https thay vi http
        .path("/") // cho phep moi api (/***)
        .maxAge(
            Duration.ofDays(7))
        // .domain("example.com") // domain nao duoc su dung
        .build();
    return ResponseEntity.ok().header(org.springframework.http.HttpHeaders.SET_COOKIE, resCookies.toString()).body(res);
  }

  @PostMapping("/verify-user")
  @ApiMessage("verify user")
  public ResponseEntity<String> verifyUser(@RequestBody ReqOtpDTO req) {
    return ResponseEntity.ok(authService.verifyUser(req));

  }

  @PostMapping("/logout")
  @ApiMessage("logout")
  public ResponseEntity<String> logout(HttpServletResponse response) {
    authService.logout(response);
    return ResponseEntity.ok("Logout success");
  }

  @PostMapping("/forgot-password")
  @ApiMessage("forgot Password")
  public ResponseEntity<String> forgotPassword(@Valid @RequestBody ReqForgotPasswordDTO req) {
    authService.forgotPassword(req);
    return ResponseEntity.ok("Send otp success");
  }

  @PostMapping("/verify-reset-otp")
  @ApiMessage("verifyResetOtp")
  public ResponseEntity<String> verifyResetOtp(
      @RequestBody ReqOtpDTO req) {
    authService.verifyResetOtp(req);
    return ResponseEntity.ok("OTP verified");
  }

  @PostMapping("/reset-password")
  @ApiMessage("reset password")
  public ResponseEntity<String> resetPassword(
      @Valid @RequestBody ReqResetPasswordDTO req) {
    authService.resetPassword(req);
    return ResponseEntity.ok("Reset password success");
  }

  @PostMapping("/refresh-token")
  @ApiMessage("refresh token")
  public ResponseEntity<ResLoginDTO> refreshToken(HttpServletRequest request) {

    String refreshToken = null;
    if (request.getCookies() != null) {
      for (Cookie cookie : request.getCookies()) {
        if ("refresh_token".equals(cookie.getName())) {
          refreshToken = cookie.getValue();
          break;
        }
      }
    }
    if (refreshToken == null) {
      throw new BadRequestException("Refresh token not found");
    }
    ResLoginDTO res = authService.refreshToken(refreshToken);
    ResponseCookie cookie = ResponseCookie.from("refresh_token",
        res.getRefreshToken())
        .httpOnly(true)
        .secure(true)
        .path("/")
        .maxAge(Duration.ofDays(7))
        .build();

    return ResponseEntity.ok().header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString()).body(res);
  }

  @GetMapping("/myProfile")
  @ApiMessage("get my profile")
  public ResponseEntity<UserProfileResponseDTO> getMyProfile() {
    return ResponseEntity.ok(userServiceImpl.getMyProfile());
  }

  @PostMapping("/updateProfile")
  @ApiMessage("update profile")
  public ResponseEntity<UserProfileResponseDTO> updateProfile(
      @Valid @RequestBody ReqUpdateProfileDTO request) {
    return ResponseEntity.ok(userServiceImpl.updateMyProfile(request));
  }

}
