package com.mycompany.saas_japanese.controller;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import com.mycompany.saas_japanese.domain.query.SpeakingTopicQuery;
import com.mycompany.saas_japanese.domain.request.ReqSpeakingTopic;
import com.mycompany.saas_japanese.domain.response.SpeakingTopicResponse;
import com.mycompany.saas_japanese.service.SpeakingTopicService;
import com.mycompany.saas_japanese.util.anotation.ApiMessage;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class SpeakingTopicController {
  private final SpeakingTopicService service;

  @GetMapping("/speaking/topics")
  @ApiMessage("Fetch published speaking topics")
  public ResponseEntity<Page<SpeakingTopicResponse>> findPublished(@Valid SpeakingTopicQuery query) {
    return ResponseEntity.ok(service.findPublished(query));
  }

  @PostMapping("/admin/speaking/topics")
  @ApiMessage("Create speaking topic")
  public ResponseEntity<SpeakingTopicResponse> create(@Valid @RequestBody ReqSpeakingTopic request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
  }
}

