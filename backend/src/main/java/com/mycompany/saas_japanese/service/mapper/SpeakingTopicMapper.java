package com.mycompany.saas_japanese.service.mapper;

import org.springframework.stereotype.Component;
import com.mycompany.saas_japanese.domain.SpeakingTopic;
import com.mycompany.saas_japanese.domain.response.SpeakingTopicResponse;

@Component
public class SpeakingTopicMapper {
  public SpeakingTopicResponse toResponse(SpeakingTopic topic) {
    return new SpeakingTopicResponse(topic.getId(), topic.getTitle(), topic.getDescription());
  }
}

