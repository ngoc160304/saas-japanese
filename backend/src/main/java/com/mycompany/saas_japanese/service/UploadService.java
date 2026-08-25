package com.mycompany.saas_japanese.service;

import java.util.Map;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.saas_japanese.domain.Media;

public interface UploadService {
  public Media uploadImage(MultipartFile file);

  public Media uploadVideo(MultipartFile file);

  public Media getMediaById(Long id);
}
