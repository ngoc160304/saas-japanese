package com.mycompany.saas_japanese.domain.query;

import com.mycompany.saas_japanese.util.constant.JlptLevelEnum;

import lombok.Getter;
import lombok.Setter;

@Setter 
@Getter 
public class JlptExamQuery extends BaseQuery {
    private String title;
    private JlptLevelEnum jlptLevel;
}
