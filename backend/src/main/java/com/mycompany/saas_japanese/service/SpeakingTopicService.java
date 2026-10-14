package com.mycompany.saas_japanese.service;

import org.springframework.data.domain.Page;
import com.mycompany.saas_japanese.domain.query.SpeakingTopicQuery;
import com.mycompany.saas_japanese.domain.request.ReqSpeakingTopic;
import com.mycompany.saas_japanese.domain.response.SpeakingTopicResponse;

public interface SpeakingTopicService {
  Page<SpeakingTopicResponse> findPublished(SpeakingTopicQuery query);
  SpeakingTopicResponse create(ReqSpeakingTopic request);
}

