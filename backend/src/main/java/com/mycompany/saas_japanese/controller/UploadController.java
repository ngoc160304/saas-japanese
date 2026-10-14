package com.mycompany.saas_japanese.controller;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.domain.response.MediaResponse;
import com.mycompany.saas_japanese.service.UploadService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@RestController
@RequestMapping("/upload")
public class UploadController {
  private final UploadService uploadService;

  @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<?> uploadImage(
      @RequestParam("file") MultipartFile file) {
    Media result = uploadService.uploadImage(file);
    return ResponseEntity.ok(result);
  }

  @PostMapping(value = "/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<MediaResponse> uploadVideo(
      @RequestParam("file") MultipartFile file) throws IOException {
    Media result = uploadService.uploadVideo(file);
    MediaResponse response = new MediaResponse();
    response.setId(result.getId());
    response.setOriginalName(result.getOriginalName());
    response.setPublicId(result.getPublicId());
    response.setSecureUrl(result.getSecureUrl());
    return ResponseEntity.ok(response);
  }
}
