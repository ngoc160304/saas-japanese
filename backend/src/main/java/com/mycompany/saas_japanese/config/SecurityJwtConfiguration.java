package com.mycompany.saas_japanese.config;

import java.io.IOException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.security.converter.RsaKeyConverters;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;

@Configuration
public class SecurityJwtConfiguration {
  @Value("${jwt.public-key}")
  private Resource publicKeyResource;

  @Value("${jwt.private-key}")
  private Resource privateKeyResource;

  @Bean
  public JwtDecoder jwtDecoder() {
    NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withPublicKey(publicKey()).build();
    return token -> {
      try {
        return jwtDecoder.decode(token);
      } catch (Exception e) {
        System.out.println(">>> JWT error: " + e.getMessage());
        throw e;
      }
    };
  }

  @Bean
  public JwtEncoder jwtEncoder() {
    RSAKey rsa = new RSAKey.Builder(publicKey())
        .privateKey(privateKey())
        .build();
    JWKSource<SecurityContext> jwtks = new ImmutableJWKSet<>(new JWKSet(rsa));
    return new NimbusJwtEncoder(jwtks);
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthorityPrefix("");
    grantedAuthoritiesConverter.setAuthoritiesClaimName("permission");
    JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return jwtAuthenticationConverter;
  }

  @Bean
  public RSAPrivateKey privateKey() {
    try {
      return (RSAPrivateKey) RsaKeyConverters.pkcs8()
          .convert(privateKeyResource.getInputStream());
    } catch (IOException e) {
      e.printStackTrace();
    }
    return null;
  }

  @Bean
  public RSAPublicKey publicKey() {
    try {
      return (RSAPublicKey) RsaKeyConverters.x509()
          .convert(publicKeyResource.getInputStream());
    } catch (IOException e) {
      e.printStackTrace();
    }
    return null;
  }

}
