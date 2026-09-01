package com.mycompany.saas_japanese.util;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtil {

  private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

  private SlugUtil() {
  }

  public static String toSlug(String text) {

    if (text == null || text.isBlank()) {
      return "";
    }

    String slug = text.trim().toLowerCase(Locale.ROOT);

    // Xử lý các ký tự tiếng Việt đặc biệt
    slug = slug
        .replace("đ", "d")
        .replace("Đ", "d");

    // Bỏ dấu
    slug = Normalizer.normalize(slug, Normalizer.Form.NFD);
    slug = DIACRITICS_PATTERN.matcher(slug).replaceAll("");

    // Chỉ giữ chữ cái, số
    // Các ký tự khác chuyển thành "-"
    slug = slug.replaceAll("[^a-z0-9]+", "-");

    // Xóa "-" ở đầu và cuối
    slug = slug.replaceAll("^-|-$", "");

    return slug + " " + Instant.now().toEpochMilli();
  }
}
