# -*- coding: utf-8 -*-
"""Build a SHINEAI_REC_V1 replay dump (silence-like dummy Opus payloads)."""
import sys


def crc8(length: int, payload: bytes) -> int:
    value = length & 0xFF
    for byte in payload:
        value ^= byte
    return value & 0xFF


def main() -> int:
    out = sys.argv[1] if len(sys.argv) > 1 else 'fake-cdc.bin'
    frames = int(sys.argv[2]) if len(sys.argv) > 2 else 400
    payload = bytes([0x00] * 40)
    with open(out, 'wb') as fh:
        fh.write(b'SHINEAI_REC_V1\n')
        for _ in range(frames):
            fh.write(bytes([0xA5, len(payload)]))
            fh.write(payload)
            fh.write(bytes([crc8(len(payload), payload)]))
    print(out)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
