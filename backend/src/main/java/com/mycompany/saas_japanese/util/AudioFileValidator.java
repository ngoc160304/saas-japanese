package com.mycompany.saas_japanese.util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

import com.mycompany.saas_japanese.util.error.BadRequestException;

public final class AudioFileValidator {
  public static final int MAX_AUDIO_BYTES = 20 * 1024 * 1024;
  private static final Set<String> WAV_MIMES = Set.of("audio/wav", "audio/x-wav", "audio/wave");
  private static final int[] MPEG1_BITRATES = {0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320};
  private static final int[] MPEG2_BITRATES = {0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160};
  private static final int[] SAMPLE_RATES = {44100, 48000, 32000};

  private AudioFileValidator() {
  }

  public static byte[] validate(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("Audio file must not be empty");
    }
    if (file.getSize() > MAX_AUDIO_BYTES) {
      throw new BadRequestException("Audio file must not exceed 20 MiB");
    }
    String name = file.getOriginalFilename();
    if (name == null || name.isBlank() || name.length() > 255) {
      throw new BadRequestException("Audio filename is required and must not exceed 255 characters");
    }
    int separator = name.lastIndexOf('.');
    String extension = separator <= 0 ? "" : name.substring(separator + 1).toLowerCase(Locale.ROOT);
    String mime = file.getContentType();
    mime = mime == null ? "" : mime.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    boolean mp3 = extension.equals("mp3") && mime.equals("audio/mpeg");
    boolean wav = extension.equals("wav") && WAV_MIMES.contains(mime);
    if (!mp3 && !wav) {
      throw new BadRequestException("Supported audio types are MP3 (audio/mpeg) and PCM WAV (audio/wav)");
    }
    try (InputStream input = file.getInputStream()) {
      byte[] bytes = input.readNBytes(MAX_AUDIO_BYTES + 1);
      if (bytes.length > MAX_AUDIO_BYTES) {
        throw new BadRequestException("Audio file must not exceed 20 MiB");
      }
      if (mp3 ? !isMp3(bytes) : !isWav(bytes)) {
        throw new BadRequestException("Audio content does not match its declared format");
      }
      return bytes;
    } catch (IOException exception) {
      throw new BadRequestException("Cannot read audio file");
    }
  }

  private static boolean isWav(byte[] bytes) {
    if (bytes.length < 44 || !tag(bytes, 0, "RIFF") || !tag(bytes, 8, "WAVE")
        || littleEndian(bytes, 4, 4) + 8 != bytes.length) {
      return false;
    }
    int alignment = 0;
    long dataSize = 0;
    int offset = 12;
    while (offset + 8 <= bytes.length) {
      long size = littleEndian(bytes, offset + 4, 4);
      int start = offset + 8;
      if (size > bytes.length - start) {
        return false;
      }
      if (tag(bytes, offset, "fmt ")) {
        if (size < 16 || alignment != 0) {
          return false;
        }
        long format = littleEndian(bytes, start, 2);
        long channels = littleEndian(bytes, start + 2, 2);
        long rate = littleEndian(bytes, start + 4, 4);
        long bits = littleEndian(bytes, start + 14, 2);
        if ((format != 1 && format != 3) || channels < 1 || channels > 2 || rate < 8000 || rate > 192000
            || (bits != 8 && bits != 16 && bits != 24 && bits != 32) || (format == 3 && bits != 32)) {
          return false;
        }
        alignment = (int) (channels * bits / 8);
        if (littleEndian(bytes, start + 12, 2) != alignment
            || littleEndian(bytes, start + 8, 4) != rate * alignment) {
          return false;
        }
      } else if (tag(bytes, offset, "data")) {
        dataSize += size;
      }
      offset = start + (int) size + (int) (size & 1);
    }
    return offset == bytes.length && alignment > 0 && dataSize >= alignment && dataSize % alignment == 0;
  }

  private static boolean isMp3(byte[] bytes) {
    int offset = 0;
    if (tag(bytes, 0, "ID3")) {
      if (bytes.length < 10 || bytes[3] < 2 || bytes[3] > 4) {
        return false;
      }
      int size = 0;
      for (int index = 6; index < 10; index++) {
        if ((bytes[index] & 0x80) != 0) {
          return false;
        }
        size = (size << 7) | bytes[index];
      }
      offset = 10 + size + (bytes[3] == 4 && (bytes[5] & 0x10) != 0 ? 10 : 0);
    }
    Mp3Frame first = frame(bytes, offset);
    if (first == null) {
      return false;
    }
    Mp3Frame second = frame(bytes, offset + first.length());
    return second != null && first.version() == second.version() && first.sampleRate() == second.sampleRate();
  }

  private static Mp3Frame frame(byte[] bytes, int offset) {
    if (offset < 0 || offset > bytes.length - 4) {
      return null;
    }
    int header = (bytes[offset] & 0xff) << 24 | (bytes[offset + 1] & 0xff) << 16
        | (bytes[offset + 2] & 0xff) << 8 | (bytes[offset + 3] & 0xff);
    int version = (header >>> 19) & 3;
    int bitrateIndex = (header >>> 12) & 15;
    int rateIndex = (header >>> 10) & 3;
    if ((header >>> 21) != 0x7ff || version == 1 || ((header >>> 17) & 3) != 1
        || bitrateIndex == 0 || bitrateIndex == 15 || rateIndex == 3) {
      return null;
    }
    int bitrate = (version == 3 ? MPEG1_BITRATES : MPEG2_BITRATES)[bitrateIndex];
    int sampleRate = SAMPLE_RATES[rateIndex] / (version == 3 ? 1 : version == 2 ? 2 : 4);
    int size = (version == 3 ? 144 : 72) * bitrate * 1000 / sampleRate + ((header >>> 9) & 1);
    return size >= 4 && size <= bytes.length - offset ? new Mp3Frame(size, version, sampleRate) : null;
  }

  private static boolean tag(byte[] bytes, int offset, String tag) {
    if (offset < 0 || offset + tag.length() > bytes.length) {
      return false;
    }
    for (int index = 0; index < tag.length(); index++) {
      if (bytes[offset + index] != tag.charAt(index)) {
        return false;
      }
    }
    return true;
  }

  private static long littleEndian(byte[] bytes, int offset, int count) {
    long value = 0;
    for (int index = 0; index < count; index++) {
      value |= (long) (bytes[offset + index] & 0xff) << (8 * index);
    }
    return value;
  }

  private record Mp3Frame(int length, int version, int sampleRate) { }
}
