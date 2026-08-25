package com.mycompany.saas_japanese.service.impl;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.UploadService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.error.BadRequestException;
import com.mycompany.saas_japanese.util.error.NotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

  private final Cloudinary cloudinary;
  private final MediaRepository mediaRepository;

  @SuppressWarnings("unchecked")
  @Override
  public Media uploadImage(MultipartFile file) {
    validateImage(file);
    try {

      Map<String, Object> result = cloudinary.uploader().upload(
          file.getBytes(),
          ObjectUtils.asMap(
              "resource_type", "image",
              "folder", "images"));
      Media media = Media.builder()
          .fileName(file.getOriginalFilename())
          .originalName(file.getOriginalFilename())
          .publicId((String) result.get("public_id"))
          .secureUrl((String) result.get("secure_url"))
          .fileType(FileTypeEnum.IMAGE)
          .mimeType(file.getContentType())
          .fileSize(file.getSize())
          .isDeleted(false)
          .isUsed(false)
          .build();

      return mediaRepository.save(media);
    } catch (IOException e) {
      throw new BadRequestException("Upload failed !");
    }
  }

  @SuppressWarnings("unchecked")
  @Override
  public Media uploadVideo(MultipartFile file) {
    validateImage(file);
    try {

      Map<String, Object> result = cloudinary.uploader().upload(
          file.getBytes(),
          ObjectUtils.asMap(
              "resource_type", "video",
              "folder", "videos"));

      Media media = Media.builder()
          .fileName(file.getOriginalFilename())
          .originalName(file.getOriginalFilename())
          .publicId((String) result.get("public_id"))
          .secureUrl((String) result.get("secure_url"))
          .fileType(FileTypeEnum.VIDEO)
          .mimeType(file.getContentType())
          .fileSize(file.getSize())
          .isDeleted(false)
          .isUsed(false)
          .build();

      return mediaRepository.save(media);
    } catch (IOException e) {
      throw new BadRequestException("Upload failed !");
    }
  }

  private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
  private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

  private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif");

  private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
      "video/mp4",
      "video/webm",
      "video/quicktime");

  public void validateImage(MultipartFile file) {

    validateNotEmpty(file);

    if (file.getSize() > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
          "Image size must not exceed 10 MB !");
    }

    if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
      throw new BadRequestException(
          "Unsupported image type !");
    }
  }

  public void validateVideo(MultipartFile file) {

    validateNotEmpty(file);

    if (file.getSize() > MAX_VIDEO_SIZE) {
      throw new BadRequestException(
          "Video size must not exceed 100 MB !");
    }

    if (!ALLOWED_VIDEO_TYPES.contains(file.getContentType())) {
      throw new BadRequestException(
          "Unsupported video type !");
    }
  }

  private void validateNotEmpty(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException(
          "File must not be empty !");
    }
  }

  @Override
  public Media getMediaById(Long id) {
    return mediaRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Media not found"));
  }
}
