package com.mycompany.saas_japanese.domain.query;

import com.mycompany.saas_japanese.util.constant.AdminJlptExamStatus;
import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminJlptExamQuery extends BaseQuery {
  private JlptLevelEnum level;
  private AdminJlptExamStatus status;
}
