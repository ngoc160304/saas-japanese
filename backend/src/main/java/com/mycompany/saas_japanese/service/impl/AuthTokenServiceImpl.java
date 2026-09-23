package com.mycompany.saas_japanese.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.saas_japanese.domain.AuthSession;
import com.mycompany.saas_japanese.domain.User;
import com.mycompany.saas_japanese.domain.response.ResLoginDTO;
import com.mycompany.saas_japanese.repository.AuthSessionRepository;
import com.mycompany.saas_japanese.repository.UserRepository;
import com.mycompany.saas_japanese.service.AuthTokenService;
import com.mycompany.saas_japanese.service.AuthTokens;

@Service
public class AuthTokenServiceImpl implements AuthTokenService {
  private static final Duration ACCESS_LIFETIME = Duration.ofMinutes(10);
  private final AuthSessionRepository sessions;
  private final UserRepository users;
  private final JwtEncoder encoder;
  private final JwtDecoder refreshDecoder;
  private final String issuer;

  public AuthTokenServiceImpl(AuthSessionRepository sessions, UserRepository users, JwtEncoder encoder,
      @Qualifier("refreshJwtDecoder") JwtDecoder refreshDecoder,
      @Value("${AUTH_JWT_ISSUER:saas-japanese}") String issuer) {
    this.sessions = sessions;
    this.users = users;
    this.encoder = encoder;
    this.refreshDecoder = refreshDecoder;
    this.issuer = issuer;
  }

  @Override
  @Transactional
  public AuthTokens create(User user, boolean rememberMe) {
    requireEnabled(user);
    AuthSession session = new AuthSession();
    session.setId(UUID.randomUUID().toString());
    session.setUserId(user.getId());
    session.setExpiresAt(Instant.now().plus(Duration.ofDays(rememberMe ? 30 : 7)));
    session.setPersistent(rememberMe);
    AuthTokens tokens = issue(user, session);
    sessions.save(session);
    return tokens;
  }

  @Override
  @Transactional(noRollbackFor = BadCredentialsException.class)
  public AuthTokens refresh(String token) {
    Jwt jwt = decodeRefresh(token);
    AuthSession session = sessions.findForUpdate(jwt.getClaimAsString("sid")).orElseThrow(this::invalidToken);
    requireLive(session);
    if (!MessageDigest.isEqual(session.getRefreshTokenHash().getBytes(StandardCharsets.US_ASCII),
        hash(token).getBytes(StandardCharsets.US_ASCII))) {
      // Commit revocation on reuse of a signed, previously rotated refresh token.
      session.setRevokedAt(Instant.now());
      sessions.save(session);
      throw invalidToken();
    }
    User user = users.findById(session.getUserId()).orElseThrow(this::invalidToken);
    requireEnabled(user);
    if (!Objects.equals(user.getEmail(), jwt.getSubject())) {
      throw invalidToken();
    }
    AuthTokens tokens = issue(user, session);
    sessions.save(session);
    return tokens;
  }

  @Override
  @Transactional
  public void revoke(String token) {
    if (token == null || token.isBlank()) {
      return;
    }
    Jwt jwt;
    try {
      jwt = decodeRefresh(token);
    } catch (BadCredentialsException ex) {
      // Logout is idempotent, including malformed/expired cookies.
      return;
    }
    sessions.findForUpdate(jwt.getClaimAsString("sid")).ifPresent(session -> {
      session.setRevokedAt(Instant.now());
      sessions.save(session);
    });
  }

  @Override
  @Transactional(readOnly = true)
  public boolean isAccessSessionValid(Jwt jwt) {
    String id = jwt.getClaimAsString("sid");
    if (id == null) {
      return false;
    }
    return sessions.findById(id)
        .filter(session -> session.getRevokedAt() == null && session.getExpiresAt().isAfter(Instant.now()))
        .flatMap(session -> users.findById(session.getUserId()))
        .filter(user -> user.isActive() && user.isVerified())
        .filter(user -> Objects.equals(user.getEmail(), jwt.getSubject()))
        .isPresent();
  }

  private AuthTokens issue(User user, AuthSession session) {
    Instant now = Instant.now();
    Instant accessExpiry = now.plus(ACCESS_LIFETIME);
    if (accessExpiry.isAfter(session.getExpiresAt())) {
      accessExpiry = session.getExpiresAt();
    }
    String access = encode(user, session, "access", now, accessExpiry);
    String refresh = encode(user, session, "refresh", now, session.getExpiresAt());
    session.setRefreshTokenHash(hash(refresh));
    ResLoginDTO response = new ResLoginDTO(access, "Bearer", Duration.between(now, accessExpiry).getSeconds(),
        new ResLoginDTO.UserLogin(user.getEmail(), user.getUsername(), user.getId()));
    return new AuthTokens(response, refresh, session.getExpiresAt(), session.isPersistent());
  }

  private String encode(User user, AuthSession session, String type, Instant now, Instant expiry) {
    JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
        .issuer(issuer).subject(user.getEmail()).audience(List.of("saas-japanese-" + type))
        .issuedAt(now).expiresAt(expiry).id(UUID.randomUUID().toString())
        .claim("token_use", type).claim("sid", session.getId());
    if ("access".equals(type)) {
      claims.claim("permission", List.of("ROLE_ADMIN"));
    }
    return encoder.encode(JwtEncoderParameters.from(
        JwsHeader.with(SignatureAlgorithm.RS256).build(), claims.build())).getTokenValue();
  }

  private Jwt decodeRefresh(String token) {
    if (token == null || token.isBlank()) {
      throw invalidToken();
    }
    try {
      Jwt jwt = refreshDecoder.decode(token);
      if (!"refresh".equals(jwt.getClaimAsString("token_use")) || jwt.getClaimAsString("sid") == null) {
        throw invalidToken();
      }
      return jwt;
    } catch (JwtException | IllegalArgumentException ex) {
      throw invalidToken();
    }
  }

  private void requireLive(AuthSession session) {
    if (session.getRevokedAt() != null || !session.getExpiresAt().isAfter(Instant.now())) {
      throw invalidToken();
    }
  }

  private void requireEnabled(User user) {
    if (!user.isActive() || !user.isVerified()) {
      throw invalidToken();
    }
  }

  private BadCredentialsException invalidToken() {
    return new BadCredentialsException("Invalid or expired token");
  }

  private String hash(String value) {
    try {
      return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 unavailable", ex);
    }
  }
}
