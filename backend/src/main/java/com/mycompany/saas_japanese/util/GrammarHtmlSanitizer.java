package com.mycompany.saas_japanese.util;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

@Component
public class GrammarHtmlSanitizer {
  private static final Safelist SAFE_GRAMMAR = Safelist.relaxed()
      .removeTags("img")
      .addTags("hr", "s", "code")
      .removeProtocols("a", "href", "ftp")
      .addProtocols("a", "href", "http", "https", "mailto")
      .addEnforcedAttribute("a", "rel", "nofollow noopener noreferrer");

  public String sanitize(String html) {
    if (html == null || html.isBlank()) {
      return null;
    }
    String cleaned = Jsoup.clean(html, SAFE_GRAMMAR).trim();
    return cleaned.isBlank() ? null : cleaned;
  }
}
