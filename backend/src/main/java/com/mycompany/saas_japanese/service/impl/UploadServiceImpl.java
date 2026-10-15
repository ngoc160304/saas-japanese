package com.mycompany.saas_japanese.service.impl;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mycompany.saas_japanese.domain.Media;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.UploadService;
import com.mycompany.saas_japanese.util.constant.FileTypeEnum;
import com.mycompany.saas_japanese.util.AudioFileValidator;
import com.mycompany.saas_japanese.util.error.BadRequestException;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

  private final Cloudinary cloudinary;
  private final MediaRepository mediaRepository;

  @Override
  @Transactional(propagation = Propagation.NOT_SUPPORTED)
  public Media uploadAudio(MultipartFile file) {
    byte[] bytes = AudioFileValidator.validate(file);
    try {
      Map<?, ?> result = cloudinary.uploader().upload(bytes,
          ObjectUtils.asMap("resource_type", "video", "folder", "audios"));
      // Cloudinary handles audio via resource_type=video; our domain retains AUDIO.
      return mediaRepository.save(Media.builder()
          .fileName(file.getOriginalFilename()).originalName(file.getOriginalFilename())
          .publicId((String) result.get("public_id")).secureUrl((String) result.get("secure_url"))
          .fileType(FileTypeEnum.AUDIO)
          .mimeType(file.getContentType().split(";", 2)[0].trim().toLowerCase(Locale.ROOT))
          .fileSize((long) bytes.length)
          .isDeleted(false).isUsed(false).build());
    } catch (IOException exception) {
      throw new BadRequestException("Audio upload failed");
    }
  }

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
          .filePath(null)
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
    validateVideo(file);
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
      "jpeg",
      "png",
      "webp",
      "gif");

  private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
      "mp4",
      "webm",
      "mov",
      "quicktime");

  public void validateImage(MultipartFile file) {
    validateNotEmpty(file);

    if (file.getSize() > MAX_IMAGE_SIZE) {
      throw new BadRequestException(
          "Image size must not exceed 10 MB !");
    }

    String filename = file.getOriginalFilename();
    if (filename == null || filename.isBlank() || filename.length() > 255) {
      throw new BadRequestException("Image filename is required and must not exceed 255 characters");
    }
    String extension = filename.contains(".")
        ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
    String mime = file.getContentType();
    mime = mime == null ? "" : mime.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    if (!ALLOWED_IMAGE_TYPES.contains(extension) || !mime.equals("image/" + extension)) {
      throw new BadRequestException("Unsupported image type");
    }
    try (InputStream stream = file.getInputStream()) {
      byte[] header = stream.readNBytes(12);
      boolean matches = header.length >= 12 && switch (extension) {
        case "png" -> header[0] == (byte) 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G'
            && header[4] == 13 && header[5] == 10 && header[6] == 26 && header[7] == 10;
        case "jpeg" -> header[0] == (byte) 0xff && header[1] == (byte) 0xd8 && header[2] == (byte) 0xff;
        case "gif" -> header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8'
            && (header[4] == '7' || header[4] == '9') && header[5] == 'a';
        case "webp" -> header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
            && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
        default -> false;
      };
      if (!matches) {
        throw new BadRequestException("Image content does not match its declared format");
      }
    } catch (IOException exception) {
      throw new BadRequestException("Cannot read image file");
    }
  }

  public void validateVideo(MultipartFile file) {
    validateNotEmpty(file);

    if (file.getSize() > MAX_VIDEO_SIZE) {
      throw new BadRequestException(
          "Video size must not exceed 100 MB !");
    }

    String filename = file.getOriginalFilename();
    String extension = filename == null || !filename.contains(".") ? ""
        : filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    String mime = file.getContentType();
    if (!ALLOWED_VIDEO_TYPES.contains(extension)
        || !("mp4".equals(extension) && "video/mp4".equals(mime)
            || "webm".equals(extension) && "video/webm".equals(mime)
            || ("mov".equals(extension) || "quicktime".equals(extension))
                && "video/quicktime".equals(mime))) {
      throw new BadRequestException("Unsupported video type");
    }
    try (InputStream stream = file.getInputStream()) {
      byte[] header = stream.readNBytes(12);
      boolean isoMedia = header.length >= 8 && header[4] == 'f' && header[5] == 't'
          && header[6] == 'y' && header[7] == 'p';
      boolean webm = header.length >= 4 && (header[0] & 0xff) == 0x1a
          && (header[1] & 0xff) == 0x45 && (header[2] & 0xff) == 0xdf
          && (header[3] & 0xff) == 0xa3;
      if ("webm".equals(extension) ? !webm : !isoMedia) {
        throw new BadRequestException("Invalid video file");
      }
    } catch (IOException exception) {
      throw new BadRequestException("Cannot read video file");
    }
  }

  private void validateNotEmpty(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException(
          "File must not be empty !");
    }
  }

  private static final long MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

  public void validateAudio(MultipartFile file) {
    validateNotEmpty(file);

    if (file.getSize() > MAX_AUDIO_SIZE) {
      throw new BadRequestException(
          "Audio size must not exceed 20 MB");
    }

    String filename = file.getOriginalFilename();

    String extension = filename == null || !filename.contains(".")
        ? ""
        : filename.substring(filename.lastIndexOf('.') + 1)
            .toLowerCase(Locale.ROOT);

    if (!"mp3".equals(extension)) {
      throw new BadRequestException("Unsupported audio type");
    }

    String mime = file.getContentType();

    if (!"audio/mpeg".equals(mime) && !"audio/mp3".equals(mime)) {
      throw new BadRequestException("Invalid audio MIME type");
    }

    try (InputStream stream = file.getInputStream()) {
      byte[] header = stream.readNBytes(3);

      boolean hasId3 = header.length == 3
          && header[0] == 'I'
          && header[1] == 'D'
          && header[2] == '3';

      boolean hasFrameSync = header.length >= 2
          && (header[0] & 0xFF) == 0xFF
          && (header[1] & 0xE0) == 0xE0;

      if (!hasId3 && !hasFrameSync) {
        throw new BadRequestException("Invalid MP3 file");
      }

    } catch (IOException e) {
      throw new BadRequestException("Cannot read audio file");
    }
  }

  @SuppressWarnings("unchecked")
  @Override
  public Media uploadAudio(MultipartFile file) {
    validateAudio(file);

    try {
      Map<String, Object> result = cloudinary.uploader().upload(
          file.getBytes(),
          ObjectUtils.asMap(
              "resource_type", "video",
              "folder", "audios"));

      Media media = Media.builder()
          .fileName(file.getOriginalFilename())
          .originalName(file.getOriginalFilename())
          .publicId((String) result.get("public_id"))
          .secureUrl((String) result.get("secure_url"))
          .fileType(FileTypeEnum.AUDIO)
          .mimeType(file.getContentType())
          .fileSize(file.getSize())
          .filePath(null)
          .isDeleted(false)
          .isUsed(false)
          .build();

      return mediaRepository.save(media);

    } catch (IOException e) {
      throw new BadRequestException("Audio upload failed");
    }
  }

  @Override
  public Media getMediaById(Long id) {
    // TODO Auto-generated method stub
    throw new UnsupportedOperationException("Unimplemented method 'getMediaById'");
  }
}
