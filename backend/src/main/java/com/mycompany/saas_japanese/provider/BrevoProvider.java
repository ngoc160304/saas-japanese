package com.mycompany.saas_japanese.provider;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import com.mycompany.saas_japanese.util.error.ServiceUnavailableException;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import kong.unirest.HttpResponse;
import kong.unirest.Unirest;

@Component
public class BrevoProvider {

  private final SpringTemplateEngine templateEngine;

  public BrevoProvider(SpringTemplateEngine templateEngine) {
    this.templateEngine = templateEngine;
  }

  @Value("${brevo.api.key}")
  private String apiKey;

  public String sendOtpEmail(String targetEmail, String customerName, String otpCode) {
    try {
      // Thiết kế giao diện HTML động bằng Text Block và đặt sẵn các vị trí %s
      Context context = new Context();

      context.setVariable("name", customerName);
      context.setVariable("otp", otpCode);

      String finalHtmlContent = templateEngine.process("otp-email", context);

      // Cấu hình Body gửi tới Brevo
      Map<String, Object> emailBody = Map.of(
          "subject", "[" + otpCode + "] Mã xác thực OTP của bạn",
          "htmlContent", finalHtmlContent,
          "sender", Map.of(
              "name", "Hệ thống Xác thực",
              "email", "nguyenlchingoc@dtu.edu.vn"),
          "to", List.of(
              Map.of(
                  "name", customerName,
                  "email", targetEmail)));

      HttpResponse<String> response = Unirest.post("https://api.brevo.com/v3/smtp/email")
          .header("api-key", apiKey)
          .header("Content-Type", "application/json")
          .body(emailBody)
          .asString();

      if (response.getStatus() == 201 || response.getStatus() == 200) {
        return "Gửi OTP thành công!";
      } else {
        throw new ServiceUnavailableException("Email delivery failed");
      }

    } catch (Exception e) {
      throw new ServiceUnavailableException("Email delivery failed");
    }
  }
}
