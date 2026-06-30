package com.mycompany.saas_japanese.controller;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.request.ReqLoginDTO;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.service.AuthService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;

import kong.unirest.HttpStatus;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;

  AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  @ApiMessage("register")
  public ResponseEntity<User> createdNewCourses(@RequestBody User postUser) {
    User user = this.authService.register(postUser);
    return ResponseEntity.status(HttpStatus.CREATED).body(user);
  }

  @PostMapping("/login")
  @ApiMessage("login")
  public ResponseEntity<ResLoginDTO> login(@RequestBody ReqLoginDTO postUser) {
    ResLoginDTO res = this.authService.login(postUser);
    ResponseCookie resCookies = ResponseCookie.from("refresh_token",
        res.getRefreshToen())
        .httpOnly(true)
        .secure(true) // chi duoc su dung voi https thay vi http
        .path("/") // cho phep moi api (/***)
        .maxAge(
            Duration.ofDays(7))
        // .domain("example.com") // domain nao duoc su dung
        .build();
    return ResponseEntity.ok().header(org.springframework.http.HttpHeaders.SET_COOKIE, resCookies.toString()).body(res);
  }

}
