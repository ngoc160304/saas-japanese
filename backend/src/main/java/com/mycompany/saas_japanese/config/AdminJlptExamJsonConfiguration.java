package com.mycompany.saas_japanese.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverters;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.mycompany.saas_japanese.domain.request.ReqAdminJlptAnswer;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptExam;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptPart;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptQuestion;
import com.mycompany.saas_japanese.domain.request.ReqAdminJlptSession;
import com.mycompany.saas_japanese.domain.request.ReqJlptSortOrder;

import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.cfg.EnumFeature;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.type.LogicalType;

@Configuration
public class AdminJlptExamJsonConfiguration implements WebMvcConfigurer {
  @Override
  public void configureMessageConverters(HttpMessageConverters.ServerBuilder builder) {
    builder.configureMessageConverters(converter -> {
      if (converter instanceof JacksonJsonHttpMessageConverter json) {
        // Keep application defaults and modules; stricter scalar input applies only to JLPT admin bodies.
        JsonMapper strictMapper = json.getMapper().rebuild()
            .disable(DeserializationFeature.ACCEPT_FLOAT_AS_INT)
            .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
            .enable(EnumFeature.FAIL_ON_NUMBERS_FOR_ENUMS)
            .withCoercionConfig(LogicalType.Textual, coercion -> coercion
                .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail))
            .build();
        for (Class<?> type : List.of(ReqAdminJlptExam.class, ReqAdminJlptSession.class,
            ReqAdminJlptPart.class, ReqAdminJlptQuestion.class, ReqAdminJlptAnswer.class, ReqJlptSortOrder.class)) {
          json.registerMappersForType(type, mappings -> json.getSupportedMediaTypes()
              .forEach(mediaType -> mappings.put(mediaType, strictMapper)));
        }
      }
    });
  }
}
