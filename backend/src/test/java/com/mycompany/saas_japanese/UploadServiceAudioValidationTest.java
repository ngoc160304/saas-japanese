package com.mycompany.saas_japanese;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.saas_japanese.util.AudioFileValidator;
import com.mycompany.saas_japanese.util.error.BadRequestException;

class UploadServiceAudioValidationTest {
  @Test
  void acceptsSupportedFormatsCaseInsensitiveNamesAndMimeParameters() {
    assertThat(AudioFileValidator.validate(file("track.MP3", "audio/mpeg", AudioTestFiles.mp3())))
        .isEqualTo(AudioTestFiles.mp3());
    for (String mime : List.of("audio/wav", "audio/x-wav", "audio/wave", "audio/wav; codecs=1")) {
      assertThat(AudioFileValidator.validate(file("track.WAV", mime, AudioTestFiles.wav())))
          .isEqualTo(AudioTestFiles.wav());
    }
  }

  @Test
  void acceptsMp3WithId3ButRejectsMetadataWithoutAudioAndTruncatedFrames() {
    byte[] tagged = new byte[10 + AudioTestFiles.mp3().length];
    tagged[0] = 'I'; tagged[1] = 'D'; tagged[2] = '3'; tagged[3] = 4;
    System.arraycopy(AudioTestFiles.mp3(), 0, tagged, 10, AudioTestFiles.mp3().length);
    assertThat(AudioFileValidator.validate(file("track.mp3", "audio/mpeg", tagged))).isEqualTo(tagged);
    for (byte[] invalid : List.of(Arrays.copyOf(tagged, 10), Arrays.copyOf(AudioTestFiles.mp3(), 700),
        new byte[] {(byte) 0xff, (byte) 0xfb, (byte) 0x90, 0})) {
      rejects(file("track.mp3", "audio/mpeg", invalid));
    }
    tagged[6] = (byte) 0xff;
    rejects(file("track.mp3", "audio/mpeg", tagged));
  }

  @Test
  void rejectsEmptyMissingWrongExtensionsMimeAndObviousDisguisedContent() {
    rejects(null);
    rejects(file("empty.wav", "audio/wav", new byte[0]));
    for (String name : List.of("track.exe", "track", "", "x".repeat(256) + ".wav")) {
      rejects(file(name, "audio/wav", AudioTestFiles.wav()));
    }
    rejects(file("track.wav", null, AudioTestFiles.wav()));
    rejects(file("wav", "audio/wav", AudioTestFiles.wav()));
    rejects(file("mp3", "audio/mpeg", AudioTestFiles.mp3()));
    rejects(file("track.wav", "image/png", AudioTestFiles.wav()));
    rejects(file("track.mp3", "audio/mpeg", AudioTestFiles.wav()));
    rejects(file("track.wav", "audio/wav", AudioTestFiles.mp3()));
    rejects(file("track.mp3", "audio/mpeg", "<script>not audio</script>".getBytes(StandardCharsets.UTF_8)));
    rejects(file("track.wav", "audio/wav", new byte[] {(byte) 0x89, 'P', 'N', 'G', 0, 0, 0, 0}));
    rejects(file("track.mp3", "audio/mpeg", new byte[] {0, 0, 0, 12, 'f', 't', 'y', 'p', 'm', 'p', '4', '2'}));
  }

  @Test
  void wavRequiresConsistentRiffChunksPcmFormatAndNonemptySamples() {
    for (int offset : new int[] {0, 4, 8, 16, 20, 22, 24, 28, 32, 34, 40}) {
      byte[] invalid = AudioTestFiles.wav();
      invalid[offset] = (byte) 0xff;
      rejects(file("track.wav", "audio/wav", invalid));
    }
    rejects(file("track.wav", "audio/wav", AudioTestFiles.wav(44)));
    rejects(file("track.wav", "audio/wav", Arrays.copyOf(AudioTestFiles.wav(), 46)));
  }

  @Test
  void enforcesActualAndDeclaredSizeAndAcceptsTheExactLimit() throws IOException {
    MultipartFile tooLarge = mock(MultipartFile.class);
    when(tooLarge.getSize()).thenReturn((long) AudioFileValidator.MAX_AUDIO_BYTES + 1);
    rejects(tooLarge);
    MultipartFile underreported = mock(MultipartFile.class);
    when(underreported.getOriginalFilename()).thenReturn("track.wav");
    when(underreported.getContentType()).thenReturn("audio/wav");
    when(underreported.getInputStream()).thenReturn(
        new ByteArrayInputStream(new byte[AudioFileValidator.MAX_AUDIO_BYTES + 1]));
    rejects(underreported);
    assertThat(AudioFileValidator.validate(file("track.wav", "audio/wav",
        AudioTestFiles.wav(AudioFileValidator.MAX_AUDIO_BYTES)))).hasSize(AudioFileValidator.MAX_AUDIO_BYTES);
  }

  @Test
  void unreadableContentReturnsABadRequest() throws IOException {
    MultipartFile unreadable = mock(MultipartFile.class);
    when(unreadable.getOriginalFilename()).thenReturn("track.mp3");
    when(unreadable.getContentType()).thenReturn("audio/mpeg");
    when(unreadable.getInputStream()).thenThrow(new IOException("test stream failure"));
    rejects(unreadable);
  }

  private MockMultipartFile file(String name, String mime, byte[] bytes) {
    return new MockMultipartFile("file", name, mime, bytes);
  }

  private void rejects(MultipartFile file) {
    assertThatThrownBy(() -> AudioFileValidator.validate(file)).isInstanceOf(BadRequestException.class);
  }
}
