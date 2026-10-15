package com.mycompany.saas_japanese;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

final class AudioTestFiles {
  private AudioTestFiles() { }

  static byte[] wav() {
    return wav(48);
  }

  static byte[] wav(int size) {
    ByteBuffer bytes = ByteBuffer.allocate(size).order(ByteOrder.LITTLE_ENDIAN);
    bytes.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(size - 8)
        .put("WAVEfmt ".getBytes(StandardCharsets.US_ASCII)).putInt(16)
        .putShort((short) 1).putShort((short) 1).putInt(8000).putInt(16000)
        .putShort((short) 2).putShort((short) 16)
        .put("data".getBytes(StandardCharsets.US_ASCII)).putInt(size - 44);
    return bytes.array();
  }

  static byte[] mp3() {
    byte[] bytes = new byte[834];
    for (int offset : new int[] {0, 417}) {
      bytes[offset] = (byte) 0xff;
      bytes[offset + 1] = (byte) 0xfb;
      bytes[offset + 2] = (byte) 0x90;
    }
    return bytes;
  }
}
