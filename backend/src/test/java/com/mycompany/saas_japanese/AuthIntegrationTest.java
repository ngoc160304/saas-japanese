package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.Otp;
import com.mycompany.saas_japanese.repository.AuthSessionRepository;
import com.mycompany.saas_japanese.repository.OtpRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AuthTokenService;
import com.mycompany.saas_japanese.service.AuthTokens;
import com.mycompany.saas_japanese.util.error.ServiceUnavailableException;
import jakarta.servlet.http.Cookie;
import tools.jackson.databind.json.JsonMapper;

class AuthIntegrationTest extends AuthTestSupport {
  private static final String EMAIL = "learner@example.com";
  private static final String PASSWORD = UUID.randomUUID().toString();
  private static final JsonMapper JSON = JsonMapper.builder().build();

  @Autowired
  private WebApplicationContext context;
  @Autowired
  private UserRepository users;
  @Autowired
  private OtpRepository otps;
  @Autowired
  private AuthSessionRepository sessions;
  @Autowired
  private PasswordEncoder passwords;
  @Autowired
  private AuthTokenService tokens;
  @Autowired
  private JwtEncoder encoder;
  @Autowired
  private JwtDecoder accessDecoder;
  @Autowired
  @Qualifier("refreshJwtDecoder")
  private JwtDecoder refreshDecoder;

  private MockMvc mvc;
  private User user;
  private Cookie[] csrfCookies;
  private String csrfHeader;
  private String csrfValue;

  @BeforeEach
  void setUp() throws Exception {
    mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    MvcResult bootstrap = mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
    csrfCookies = bootstrap.getResponse().getCookies();
    var csrfBody = JSON.readTree(bootstrap.getResponse().getContentAsString()).get("data");
    csrfHeader = csrfBody.get("headerName").asText();
    csrfValue = csrfBody.get("token").asText();
    sessions.deleteAll();
    otps.deleteAll();
    users.deleteAll();
    user = new User();
    user.setEmail(EMAIL);
    user.setUsername("Learner");
    user.setPassword(passwords.encode(PASSWORD));
    user.setActive(true);
    user.setVerified(true);
    user = users.save(user);
  }

  @Test
  void registerUsesAllowlistedFieldsAndReturnsNoEntityOrPassword() throws Exception {
    String body = JSON.writeValueAsString(java.util.Map.of(
        "fullName", "New Learner", "email", "new@example.com", "password", PASSWORD,
        "id", user.getId(), "active", false, "verified", true, "role", "ADMIN"));
    mvc.perform(post("/api/v1/auth/register").with(validCsrf()).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.nextAction").value("VERIFY_EMAIL"))
        .andExpect(jsonPath("$.data.password").doesNotExist())
        .andExpect(jsonPath("$.data.id").doesNotExist())
        .andExpect(jsonPath("$.data.verified").doesNotExist());
    User created = users.findByEmail("new@example.com").orElseThrow();
    assertThat(created.getId()).isNotEqualTo(user.getId());
    assertThat(created.isActive()).isTrue();
    assertThat(created.isVerified()).isFalse();
    assertThat(passwords.matches(PASSWORD, created.getPassword())).isTrue();
    assertThat(users.findById(user.getId()).orElseThrow().getEmail()).isEqualTo(EMAIL);
  }

  @Test
  void registerDuplicateEmailDoesNotReplaceCredentials() throws Exception {
    mvc.perform(post("/api/v1/auth/register").with(validCsrf()).contentType(MediaType.APPLICATION_JSON)
        .content(JSON.writeValueAsString(java.util.Map.of("fullName", "Replacement",
            "email", EMAIL, "password", UUID.randomUUID().toString()))))
        .andExpect(status().isConflict()).andExpect(jsonPath("$.trace").doesNotExist());
    assertThat(passwords.matches(PASSWORD, users.findById(user.getId()).orElseThrow().getPassword())).isTrue();
  }

  @ParameterizedTest
  @ValueSource(strings = {"{}", "{", "{\"fullName\":\" \",\"email\":\"invalid\",\"password\":\"short\"}"})
  void invalidRegistrationReturns400WithoutStackTrace(String body) throws Exception {
    mvc.perform(post("/api/v1/auth/register").with(validCsrf()).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.trace").doesNotExist());
  }

  @Test
  void registerRejectsPasswordBeyondBcryptByteLimit() throws Exception {
    mvc.perform(post("/api/v1/auth/register").with(validCsrf()).contentType(MediaType.APPLICATION_JSON)
        .content(JSON.writeValueAsString(java.util.Map.of(
            "fullName", "Learner", "email", "new@example.com", "password", "あ".repeat(25)))))
        .andExpect(status().isBadRequest());
    assertThat(users.existsByEmail("new@example.com")).isFalse();
  }

  @Test
  void failedEmailDeliveryRollsBackRegistration() throws Exception {
    doThrow(new ServiceUnavailableException("provider details"))
        .when(brevo).sendOtpEmail(anyString(), anyString(), anyString());
    mvc.perform(post("/api/v1/auth/register").with(validCsrf()).contentType(MediaType.APPLICATION_JSON)
        .content(JSON.writeValueAsString(java.util.Map.of(
            "fullName", "Learner", "email", "new@example.com", "password", PASSWORD))))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.message").value("Service temporarily unavailable"))
        .andExpect(jsonPath("$.trace").doesNotExist());
    assertThat(users.existsByEmail("new@example.com")).isFalse();
    assertThat(otps.count()).isZero();
  }

  @Test
  void loginReturnsOnlyAccessTokenAndSetsSecureCookie() throws Exception {
    MvcResult result = login(EMAIL, PASSWORD, true)
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.access_token").isString())
        .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
        .andExpect(jsonPath("$.data.refresh_token").doesNotExist())
        .andExpect(jsonPath("$.data.user.password").doesNotExist())
        .andExpect(header().string("Cache-Control", "no-store")).andReturn();
    Cookie cookie = refreshCookie(result);
    assertThat(cookie.isHttpOnly()).isTrue();
    assertThat(cookie.getSecure()).isTrue();
    assertThat(cookie.getPath()).isEqualTo("/api/v1/auth");
    assertThat(cookie.getAttribute("SameSite")).isEqualTo("Lax");
    assertThat(cookie.getDomain()).isNull();
    assertThat(cookie.getMaxAge()).isPositive().isLessThanOrEqualTo(30 * 24 * 60 * 60);
    String access = JSON.readTree(result.getResponse().getContentAsString()).at("/data/access_token").asText();
    assertThat(accessDecoder.decode(access).getClaims()).doesNotContainKeys("password", "user", "refreshToken");
    assertThat(refreshDecoder.decode(cookie.getValue()).getClaimAsString("token_use")).isEqualTo("refresh");
    assertThat(sessions.findAll().get(0).getRefreshTokenHash()).hasSize(64).isNotEqualTo(cookie.getValue());
  }

  @Test
  void loginWithoutRememberMeUsesSessionCookie() throws Exception {
    Cookie cookie = refreshCookie(login(EMAIL, PASSWORD, false).andExpect(status().isOk()).andReturn());
    assertThat(cookie.getMaxAge()).isEqualTo(-1);
  }

  @Test
  void wrongPasswordAndUnknownEmailReturnSame401() throws Exception {
    String wrong = UUID.randomUUID().toString();
    login(EMAIL, wrong, false).andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("Invalid credentials or token"));
    login("unknown@example.com", wrong, false).andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("Invalid credentials or token"));
    assertThat(sessions.count()).isZero();
  }

  @ParameterizedTest
  @ValueSource(booleans = {true, false})
  void loginRejectsInactiveOrUnverifiedUser(boolean inactive) throws Exception {
    user.setActive(!inactive);
    user.setVerified(inactive);
    users.save(user);
    login(EMAIL, PASSWORD, false).andExpect(status().isForbidden());
    login(EMAIL, UUID.randomUUID().toString(), false).andExpect(status().isUnauthorized());
    assertThat(sessions.count()).isZero();
  }

  @Test
  void unauthenticatedApisReturn401AndRegularUserCannotWriteManagementData() throws Exception {
    mvc.perform(get("/api/v1/auth/myProfile")).andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.status").value(401)).andExpect(jsonPath("$.trace").doesNotExist());
    AuthTokens issued = tokens.create(user, false);
    mvc.perform(get("/api/v1/auth/myProfile").header("Authorization", "Bearer " + issued.response().accessToken()))
        .andExpect(status().isOk()).andExpect(jsonPath("$.data.email").value(EMAIL));
    mvc.perform(post("/api/v1/course-categories").header("Authorization",
        "Bearer " + issued.response().accessToken()).contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isForbidden()).andExpect(jsonPath("$.status").value(403));
  }

  @Test
  void refreshTokenCannotAuthenticateApiAndAccessTokenCannotRefresh() throws Exception {
    AuthTokens issued = tokens.create(user, false);
    mvc.perform(get("/api/v1/auth/myProfile").header("Authorization", "Bearer " + issued.refreshToken()))
        .andExpect(status().isUnauthorized());
    refresh(issued.response().accessToken()).andExpect(status().isUnauthorized());
    assertThatThrownBy(() -> accessDecoder.decode(issued.refreshToken())).isInstanceOf(JwtException.class);
    assertThatThrownBy(() -> refreshDecoder.decode(issued.response().accessToken())).isInstanceOf(JwtException.class);
  }

  @Test
  void refreshRotatesAndReplayRevokesTheWholeSession() throws Exception {
    AuthTokens issued = tokens.create(user, false);
    Instant expiry = issued.refreshExpiresAt();
    MvcResult result = refresh(issued.refreshToken()).andExpect(status().isOk())
        .andExpect(jsonPath("$.data.refreshToken").doesNotExist()).andReturn();
    String rotated = refreshCookie(result).getValue();
    assertThat(rotated).isNotEqualTo(issued.refreshToken());
    assertThat(refreshDecoder.decode(rotated).getExpiresAt().getEpochSecond()).isEqualTo(expiry.getEpochSecond());
    refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    assertThat(sessions.findAll().get(0).getRevokedAt()).isNotNull();
    refresh(rotated).andExpect(status().isUnauthorized());
    assertThatThrownBy(() -> accessDecoder.decode(issued.response().accessToken())).isInstanceOf(JwtException.class);
  }

  @Test
  void logoutRevokesAccessAndRefreshAndIsIdempotent() throws Exception {
    AuthTokens issued = tokens.create(user, true);
    MvcResult result = mvc.perform(post("/api/v1/auth/logout").with(validCsrf())
        .cookie(new Cookie("refresh_token", issued.refreshToken())))
        .andExpect(status().isNoContent()).andExpect(content().string("")).andReturn();
    assertThat(refreshCookie(result).getMaxAge()).isZero();
    refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/auth/myProfile").header("Authorization", "Bearer " + issued.response().accessToken()))
        .andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/auth/logout").with(validCsrf())).andExpect(status().isNoContent());
    mvc.perform(post("/api/v1/auth/logout").with(validCsrf()).cookie(new Cookie("refresh_token", "malformed")))
        .andExpect(status().isNoContent());
  }

  @ParameterizedTest
  @ValueSource(booleans = {true, false})
  void accountStateChangesRejectExistingTokens(boolean inactive) throws Exception {
    AuthTokens issued = tokens.create(user, false);
    user.setActive(!inactive);
    user.setVerified(inactive);
    users.save(user);
    refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/v1/auth/myProfile").header("Authorization", "Bearer " + issued.response().accessToken()))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void expiredSessionCannotRefreshOrAuthenticate() throws Exception {
    AuthTokens issued = tokens.create(user, false);
    var session = sessions.findAll().get(0);
    session.setExpiresAt(Instant.now().minusSeconds(1));
    sessions.save(session);
    refresh(issued.refreshToken()).andExpect(status().isUnauthorized());
    assertThatThrownBy(() -> accessDecoder.decode(issued.response().accessToken())).isInstanceOf(JwtException.class);
  }

  @Test
  void missingMalformedAndExpiredRefreshTokensReturn401() throws Exception {
    mvc.perform(post("/api/v1/auth/refresh-token").with(validCsrf())).andExpect(status().isUnauthorized());
    refresh("malformed").andExpect(status().isUnauthorized());
    refresh(signedToken("refresh", "saas-japanese", Instant.now().minusSeconds(1)))
        .andExpect(status().isUnauthorized());
    refresh(signedToken("refresh", "wrong-issuer", Instant.now().plusSeconds(60)))
        .andExpect(status().isUnauthorized());
  }

  @ParameterizedTest
  @ValueSource(strings = {"login", "register", "refresh-token", "logout"})
  void authPostsRequireCsrfEvenWithBearerHeader(String path) throws Exception {
    AuthTokens issued = tokens.create(user, false);
    mvc.perform(post("/api/v1/auth/" + path).header("Authorization", "Bearer " + issued.response().accessToken())
        .contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isForbidden());
    mvc.perform(post("/api/v1/auth/" + path).with(invalidCsrf()))
        .andExpect(status().isForbidden());
  }

  @Test
  void browserCanBootstrapCsrfAndLoginWithoutHttpSession() throws Exception {
    MvcResult csrfResult = mvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk()).andReturn();
    var body = JSON.readTree(csrfResult.getResponse().getContentAsString()).get("data");
    MvcResult result = mvc.perform(post("/api/v1/auth/login")
        .cookie(csrfResult.getResponse().getCookies())
        .header(body.get("headerName").asText(), body.get("token").asText())
        .contentType(MediaType.APPLICATION_JSON).content(loginBody(EMAIL, PASSWORD, false)))
        .andExpect(status().isOk()).andReturn();
    assertThat(result.getRequest().getSession(false)).isNull();
  }

  @Test
  void corsAllowsOnlyConfiguredOrigin() throws Exception {
    mvc.perform(options("/api/v1/auth/login").header("Origin", "https://frontend.example")
        .header("Access-Control-Request-Method", "POST")
        .header("Access-Control-Request-Headers", "Content-Type,X-XSRF-TOKEN"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "https://frontend.example"))
        .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    mvc.perform(options("/api/v1/auth/login").header("Origin", "https://attacker.example")
        .header("Access-Control-Request-Method", "POST")).andExpect(status().isForbidden());
  }

  @ParameterizedTest
  @ValueSource(strings = {"forgot-password", "verify-reset-otp", "reset-password"})
  void unsafeRecoveryEndpointsAreDeniedEvenForAuthenticatedUsers(String path) throws Exception {
    AuthTokens issued = tokens.create(user, false);
    mvc.perform(post("/api/v1/auth/" + path).with(validCsrf())
        .header("Authorization", "Bearer " + issued.response().accessToken())
        .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
    assertThat(passwords.matches(PASSWORD, users.findById(user.getId()).orElseThrow().getPassword())).isTrue();
  }

  @Test
  void concurrentRefreshConsumesTokenOnceAndPersistsReplayRevocation() throws Exception {
    AuthTokens issued = tokens.create(user, false);
    var executor = Executors.newFixedThreadPool(2);
    try {
      Callable<Boolean> attempt = () -> {
        try {
          tokens.refresh(issued.refreshToken());
          return true;
        } catch (BadCredentialsException exception) {
          return false;
        }
      };
      var results = executor.invokeAll(List.of(attempt, attempt));
      assertThat(List.of(results.get(0).get(), results.get(1).get())).containsExactlyInAnyOrder(true, false);
      assertThat(sessions.findAll().get(0).getRevokedAt()).isNotNull();
    } finally {
      executor.shutdownNow();
    }
  }

  @Test
  void verificationConsumesOtpAndAllowsSubsequentLogin() throws Exception {
    user.setVerified(false);
    users.save(user);
    String code = String.format("%06d", new java.security.SecureRandom().nextInt(1_000_000));
    Otp otp = new Otp();
    otp.setEmail(EMAIL);
    otp.setOtp(code);
    otps.save(otp);
    String body = JSON.writeValueAsString(java.util.Map.of("email", EMAIL, "otp", code));
    mvc.perform(post("/api/v1/auth/verify-user").with(validCsrf())
        .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
    assertThat(users.findById(user.getId()).orElseThrow().isVerified()).isTrue();
    assertThat(otps.findAll().get(0).isUsed()).isTrue();
    login(EMAIL, PASSWORD, false).andExpect(status().isOk());
    mvc.perform(post("/api/v1/auth/verify-user").with(validCsrf())
        .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
  }

  @Test
  void verificationNeverReactivatesBlockedUser() throws Exception {
    user.setVerified(false);
    user.setActive(false);
    users.save(user);
    String code = String.format("%06d", new java.security.SecureRandom().nextInt(1_000_000));
    Otp otp = new Otp();
    otp.setEmail(EMAIL);
    otp.setOtp(code);
    otps.save(otp);
    mvc.perform(post("/api/v1/auth/verify-user").with(validCsrf()).contentType(MediaType.APPLICATION_JSON)
        .content(JSON.writeValueAsString(java.util.Map.of("email", EMAIL, "otp", code))))
        .andExpect(status().isBadRequest());
    assertThat(users.findById(user.getId()).orElseThrow().isActive()).isFalse();
    assertThat(users.findById(user.getId()).orElseThrow().isVerified()).isFalse();
  }

  @Test
  void tamperedJwtIsRejectedAndCannotRevokeAnotherSession() throws Exception {
    AuthTokens issued = tokens.create(user, false);
    String[] parts = issued.refreshToken().split("\\.");
    parts[2] = (parts[2].charAt(0) == 'A' ? "B" : "A") + parts[2].substring(1);
    String tampered = String.join(".", parts);
    refresh(tampered).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/v1/auth/logout").with(validCsrf()).cookie(new Cookie("refresh_token", tampered)))
        .andExpect(status().isNoContent());
    assertThat(sessions.findAll().get(0).getRevokedAt()).isNull();
    refresh(issued.refreshToken()).andExpect(status().isOk());
  }

  @Test
  void logoutOnlyRevokesTheCurrentSession() {
    AuthTokens first = tokens.create(user, false);
    AuthTokens second = tokens.create(user, false);
    tokens.revoke(first.refreshToken());
    assertThatThrownBy(() -> tokens.refresh(first.refreshToken())).isInstanceOf(BadCredentialsException.class);
    assertThat(tokens.refresh(second.refreshToken()).response().accessToken()).isNotBlank();
  }

  @Test
  void multibytePasswordTooLongReturns400AtLogin() throws Exception {
    login(EMAIL, "あ".repeat(25), false).andExpect(status().isBadRequest());
  }

  @ParameterizedTest
  @ValueSource(strings = {"audience", "purpose", "expiration", "session", "issuer"})
  void accessDecoderRejectsMissingRequiredClaims(String missing) {
    AuthTokens issued = tokens.create(user, false);
    String sessionId = refreshDecoder.decode(issued.refreshToken()).getClaimAsString("sid");
    JwtClaimsSet.Builder claims = JwtClaimsSet.builder().subject(EMAIL)
        .issuedAt(Instant.now()).id(UUID.randomUUID().toString());
    if (!"issuer".equals(missing)) {
      claims.issuer("saas-japanese");
    }
    if (!"audience".equals(missing)) {
      claims.audience(List.of("saas-japanese-access"));
    }
    if (!"purpose".equals(missing)) {
      claims.claim("token_use", "access");
    }
    if (!"expiration".equals(missing)) {
      claims.expiresAt(Instant.now().plusSeconds(60));
    }
    if (!"session".equals(missing)) {
      claims.claim("sid", sessionId);
    }
    String jwt = encoder.encode(JwtEncoderParameters.from(
        JwsHeader.with(SignatureAlgorithm.RS256).build(), claims.build())).getTokenValue();
    assertThatThrownBy(() -> accessDecoder.decode(jwt)).isInstanceOf(JwtException.class);
  }

  private org.springframework.test.web.servlet.ResultActions login(String email, String password, boolean remember)
      throws Exception {
    return mvc.perform(post("/api/v1/auth/login").with(validCsrf()).contentType(MediaType.APPLICATION_JSON)
        .content(loginBody(email, password, remember)));
  }

  private String loginBody(String email, String password, boolean remember) {
    return JSON.writeValueAsString(java.util.Map.of("email", email, "password", password, "rememberMe", remember));
  }

  private org.springframework.test.web.servlet.ResultActions refresh(String token) throws Exception {
    return mvc.perform(post("/api/v1/auth/refresh-token").with(validCsrf()).cookie(new Cookie("refresh_token", token)));
  }

  private Cookie refreshCookie(MvcResult result) {
    return java.util.Arrays.stream(result.getResponse().getCookies())
        .filter(cookie -> "refresh_token".equals(cookie.getName()) && "/api/v1/auth".equals(cookie.getPath()))
        .findFirst().orElseThrow();
  }

  private org.springframework.test.web.servlet.request.RequestPostProcessor validCsrf() {
    return csrfHeader(csrfValue);
  }

  private org.springframework.test.web.servlet.request.RequestPostProcessor invalidCsrf() {
    return csrfHeader("invalid");
  }

  private org.springframework.test.web.servlet.request.RequestPostProcessor csrfHeader(String value) {
    return request -> {
      java.util.List<Cookie> cookies = new java.util.ArrayList<>();
      if (request.getCookies() != null) {
        cookies.addAll(java.util.Arrays.asList(request.getCookies()));
      }
      cookies.addAll(java.util.Arrays.asList(csrfCookies));
      request.setCookies(cookies.toArray(Cookie[]::new));
      request.addHeader(csrfHeader, value);
      return request;
    };
  }

  private String signedToken(String type, String issuer, Instant expiry) {
    JwtClaimsSet claims = JwtClaimsSet.builder().issuer(issuer).subject(EMAIL)
        .audience(List.of("saas-japanese-" + type)).issuedAt(Instant.now().minusSeconds(60))
        .expiresAt(expiry).id(UUID.randomUUID().toString()).claim("token_use", type)
        .claim("sid", UUID.randomUUID().toString()).build();
    return encoder.encode(JwtEncoderParameters.from(
        JwsHeader.with(SignatureAlgorithm.RS256).build(), claims)).getTokenValue();
  }
}
