package com.mycompany.saas_japanese.domain.query;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SpeakingTopicQuery {
  @Min(0)
  private int page;

  @Min(1)
  @Max(12)
  private int size = 12;
}

