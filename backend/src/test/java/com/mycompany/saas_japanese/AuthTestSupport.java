package com.mycompany.saas_japanese;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.mycompany.saas_japanese.provider.BrevoProvider;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:auth-tests;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "brevo.api.key=",
    "cloudinary.cloud-name=test",
    "cloudinary.api-key=",
    "cloudinary.api-secret=",
    "AUTH_ALLOWED_ORIGINS=https://frontend.example",
    "AUTH_COOKIE_SECURE=true",
    "AUTH_JWT_ISSUER=saas-japanese",
    "spring.main.banner-mode=off"
})
public abstract class AuthTestSupport {
  private static final KeyPair KEY_PAIR = generateKeyPair();

  @TestBean(name = "privateKey", methodName = "com.mycompany.saas_japanese.AuthTestSupport#testPrivateKey")
  protected RSAPrivateKey privateKey;

  @TestBean(name = "publicKey", methodName = "com.mycompany.saas_japanese.AuthTestSupport#testPublicKey")
  protected RSAPublicKey publicKey;

  @MockitoBean
  protected BrevoProvider brevo;

  public static RSAPrivateKey testPrivateKey() {
    return (RSAPrivateKey) KEY_PAIR.getPrivate();
  }

  public static RSAPublicKey testPublicKey() {
    return (RSAPublicKey) KEY_PAIR.getPublic();
  }

  private static KeyPair generateKeyPair() {
    try {
      KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
      generator.initialize(2048);
      return generator.generateKeyPair();
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(exception);
    }
  }
}
