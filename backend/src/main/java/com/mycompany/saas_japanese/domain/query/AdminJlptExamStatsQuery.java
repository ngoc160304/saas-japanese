package com.mycompany.saas_japanese.domain.query;

import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminJlptExamStatsQuery {
  private String search;
  private JlptLevelEnum level;
}
