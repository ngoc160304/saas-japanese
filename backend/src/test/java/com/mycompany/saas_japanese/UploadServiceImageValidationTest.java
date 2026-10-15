package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.mycompany.saas_japanese.repository.MediaRepository;
import com.mycompany.saas_japanese.service.impl.UploadServiceImpl;
import com.mycompany.saas_japanese.util.error.BadRequestException;

class UploadServiceImageValidationTest {
  private final Cloudinary cloudinary = mock(Cloudinary.class);
  private final MediaRepository media = mock(MediaRepository.class);
  private final UploadServiceImpl uploads = new UploadServiceImpl(cloudinary, media);
  private final byte[] png = Base64.getDecoder().decode(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG1kAAAAASUVORK5CYII=");

  @Test
  void matchingSupportedImageHeadersAndMimeTypesAreAccepted() {
    uploads.validateImage(new MockMultipartFile("file", "question.png", "image/png", png));
    uploads.validateImage(new MockMultipartFile("file", "question.jpeg", "image/jpeg",
        new byte[] {(byte) 0xff, (byte) 0xd8, (byte) 0xff, (byte) 0xe0, 0, 16, 'J', 'F', 'I', 'F', 0, 1}));
    uploads.validateImage(new MockMultipartFile("file", "question.gif", "image/gif",
        new byte[] {'G', 'I', 'F', '8', '9', 'a', 1, 0, 1, 0, 0, 0}));
    uploads.validateImage(new MockMultipartFile("file", "question.webp", "image/webp",
        new byte[] {'R', 'I', 'F', 'F', 4, 0, 0, 0, 'W', 'E', 'B', 'P'}));
  }

  @Test
  void missingNamesWrongMimeAndDisguisedImagesFailBeforeProviderOrDatabaseCalls() {
    for (MockMultipartFile file : new MockMultipartFile[] {
        new MockMultipartFile("file", null, "image/png", png),
        new MockMultipartFile("file", "", "image/png", png),
        new MockMultipartFile("file", "x".repeat(256) + ".png", "image/png", png),
        new MockMultipartFile("file", "question.png", "text/plain", png),
        new MockMultipartFile("file", "question.png", null, png),
        new MockMultipartFile("file", "question.jpeg", "image/jpeg", png),
        new MockMultipartFile("file", "question.png", "image/png", new byte[] {1, 2, 3}),
        new MockMultipartFile("file", "question.svg", "image/svg+xml", png),
        new MockMultipartFile("file", "question.png", "image/png", new byte[0])}) {
      assertThatThrownBy(() -> uploads.uploadImage(file)).isInstanceOf(BadRequestException.class);
    }
    verifyNoInteractions(cloudinary, media);
  }

  @Test
  void oversizedOrUnreadableImagesProduceValidationErrors() throws IOException {
    MultipartFile file = mock(MultipartFile.class);
    when(file.getSize()).thenReturn(10L * 1024 * 1024 + 1);
    assertThatThrownBy(() -> uploads.validateImage(file)).isInstanceOf(BadRequestException.class);
    when(file.getSize()).thenReturn(50L);
    when(file.getOriginalFilename()).thenReturn("question.png");
    when(file.getContentType()).thenReturn("image/png");
    when(file.getInputStream()).thenThrow(new IOException("test read failure"));
    assertThatThrownBy(() -> uploads.validateImage(file)).isInstanceOf(BadRequestException.class);
    verifyNoInteractions(cloudinary, media);
  }
}
