package com.mycompany.saas_japanese.service.impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mycompany.saas_japanese.domain.SpeakingTopic;
import com.mycompany.saas_japanese.domain.query.SpeakingTopicQuery;
import com.mycompany.saas_japanese.domain.request.ReqSpeakingTopic;
import com.mycompany.saas_japanese.domain.response.SpeakingTopicResponse;
import com.mycompany.saas_japanese.repository.SpeakingTopicRepository;
import com.mycompany.saas_japanese.service.SpeakingTopicService;
import com.mycompany.saas_japanese.service.mapper.SpeakingTopicMapper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpeakingTopicServiceImpl implements SpeakingTopicService {
  private final SpeakingTopicRepository repository;
  private final SpeakingTopicMapper mapper;

  @Override
  public Page<SpeakingTopicResponse> findPublished(SpeakingTopicQuery query) {
    return repository.findByIsPublishedTrueAndIsDeletedFalse(
        PageRequest.of(query.getPage(), query.getSize(), Sort.by("id"))).map(mapper::toResponse);
  }

  @Override
  @Transactional
  public SpeakingTopicResponse create(ReqSpeakingTopic request) {
    SpeakingTopic topic = new SpeakingTopic();
    topic.setTitle(request.title().trim());
    topic.setDescription(request.description().trim());
    return mapper.toResponse(repository.save(topic));
  }
}

