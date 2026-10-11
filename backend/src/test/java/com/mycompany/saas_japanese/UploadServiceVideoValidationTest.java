package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.impl.UploadServiceImpl;
import com.mycompany.saas_japanese.util.error.BadRequestException;

class UploadServiceVideoValidationTest {
  private final UploadServiceImpl uploads = new UploadServiceImpl(
      mock(Cloudinary.class), mock(MediaRepository.class));

  @Test
  void acceptsMatchingMp4HeaderMimeAndExtension() {
    uploads.validateVideo(new MockMultipartFile("file", "lesson.mp4", "video/mp4",
        new byte[] {0, 0, 0, 12, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'}));
    uploads.validateVideo(new MockMultipartFile("file", "lesson.webm", "video/webm",
        new byte[] {0x1a, 0x45, (byte) 0xdf, (byte) 0xa3, 0, 0, 0, 0}));
    uploads.validateVideo(new MockMultipartFile("file", "lesson.mov", "video/quicktime",
        new byte[] {0, 0, 0, 12, 'f', 't', 'y', 'p', 'q', 't', ' ', ' '}));
  }

  @Test
  void rejectsEmptyDisguisedAndOversizedVideos() {
    assertThatThrownBy(() -> uploads.validateVideo(new MockMultipartFile(
        "file", "empty.mp4", "video/mp4", new byte[0])))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> uploads.validateVideo(new MockMultipartFile(
        "file", "lesson.mp4", "video/mp4", "not a video".getBytes())))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> uploads.validateVideo(new MockMultipartFile(
        "file", "lesson.mp4", "image/png", new byte[] {0, 0, 0, 12, 'f', 't', 'y', 'p'})))
        .isInstanceOf(BadRequestException.class);
    assertThatThrownBy(() -> uploads.validateVideo(new MockMultipartFile(
        "file", "lesson.exe", "video/mp4", new byte[] {0, 0, 0, 12, 'f', 't', 'y', 'p'})))
        .isInstanceOf(BadRequestException.class);
    MultipartFile tooLarge = mock(MultipartFile.class);
    when(tooLarge.isEmpty()).thenReturn(false);
    when(tooLarge.getSize()).thenReturn(100L * 1024 * 1024 + 1);
    assertThatThrownBy(() -> uploads.validateVideo(tooLarge)).isInstanceOf(BadRequestException.class);
  }
}
