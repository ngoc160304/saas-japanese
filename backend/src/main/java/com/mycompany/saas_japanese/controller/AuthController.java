package com.mycompany.saas_japanese.controller;

import com.mycompany.saas_japanese.repository.OtpRepository;
import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqForgotPasswordDTO;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.request.ReqOtpDTO;
import com.mycompany.saas_japanese.domain.request.ReqResetPasswordDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.service.impl.OtpServiceImpl;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import kong.unirest.HttpStatus;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final OtpRepository otpRepository;
  private final AuthService authService;

  AuthController(AuthService authService, OtpRepository otpRepository) {
    this.authService = authService;
    this.otpRepository = otpRepository;
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

  @PostMapping("/verifyUser")
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

  @PostMapping("/forgotPassword")
  @ApiMessage("forgot Password")
  public ResponseEntity<String> forgotPassword(@Valid @RequestBody ReqForgotPasswordDTO req) {
    authService.forgotPassword(req);
    return ResponseEntity.ok("Send otp success");
  }

  @PostMapping("/resetPassword")
  @ApiMessage("reset password")
  public ResponseEntity<String> resetPassword(
      @Valid @RequestBody ReqResetPasswordDTO req) {
    authService.resetPassword(req);
    return ResponseEntity.ok("Reset password success");
  }
}
