package com.mycompany.saas_japanese.provider;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import kong.unirest.HttpResponse;
import kong.unirest.Unirest;

@Service
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
        System.err.println("OKokokok");
        return "Gửi OTP thành công!";
      } else {
        System.err.println("no no no no no");
        System.err.println("Response Status: " + response.getStatus());
        System.err.println("Response Body: " + response.getBody());
        System.err.println("Response API KEY: " + apiKey);
        
        return "Thất bại: " + response.getBody();
      }

    } catch (Exception e) {
      e.printStackTrace();
      System.err.println("no no no no no 2");
      return "Lỗi: " + e.getMessage();
    }
  }
}
