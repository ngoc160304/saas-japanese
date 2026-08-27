package com.mycompany.saas_japanese.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.saas_japanese.domain.Media;
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
  public ResponseEntity<?> uploadVideo(
      @RequestParam("file") MultipartFile file) throws IOException {
    Media result = uploadService.uploadVideo(file);
    return ResponseEntity.ok(result);
  }
}
