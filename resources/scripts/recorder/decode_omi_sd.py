# -*- coding: utf-8 -*-
"""Omi SD a01.txt -> 16 kHz mono wav. Skip bad Opus packets."""
from __future__ import annotations

import sys
import wave
from pathlib import Path

import av
import numpy as np

BLOCK = 440


def extract_frames(raw: bytes) -> list[bytes]:
    frames: list[bytes] = []
    for off in range(0, len(raw), BLOCK):
        blk = raw[off:off + BLOCK]
        i = 0
        while i < len(blk):
            size = blk[i]
            i += 1
            if size in (0, 0xFF):
                break
            if i + size > len(blk):
                break
            frames.append(bytes(blk[i:i + size]))
            i += size
    return frames


def decode_pcm16k(packets: list[bytes]) -> tuple[np.ndarray, int, int]:
    ctx = av.AudioCodecContext.create("opus", "r")
    ctx.sample_rate = 16000
    ctx.layout = "mono"
    resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
    chunks: list[np.ndarray] = []
    ok = fail = 0
    for pkt in packets:
        try:
            for frame in ctx.decode(av.Packet(pkt)):
                for out in resampler.resample(frame):
                    arr = out.to_ndarray()
                    if arr.ndim > 1:
                        arr = arr[0]
                    chunks.append(arr.astype(np.int16, copy=False))
            ok += 1
        except Exception:
            fail += 1
            ctx = av.AudioCodecContext.create("opus", "r")
            ctx.sample_rate = 16000
            ctx.layout = "mono"
            resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
    try:
        for frame in ctx.decode(None):
            for out in resampler.resample(frame):
                arr = out.to_ndarray()
                if arr.ndim > 1:
                    arr = arr[0]
                chunks.append(arr.astype(np.int16, copy=False))
        for out in resampler.resample(None):
            arr = out.to_ndarray()
            if arr.ndim > 1:
                arr = arr[0]
            chunks.append(arr.astype(np.int16, copy=False))
    except Exception:
        pass
    pcm = np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.int16)
    return pcm, ok, fail


def write_wav(path: Path, pcm: np.ndarray) -> None:
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(pcm.tobytes())


def main() -> int:
    src = Path(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\魏斌\Desktop\a01.txt")
    dst = Path(sys.argv[2] if len(sys.argv) > 2 else r"C:\Users\魏斌\Desktop\a01.wav")
    packets = extract_frames(src.read_bytes())
    pcm, ok, fail = decode_pcm16k(packets)
    write_wav(dst, pcm)
    x = pcm.astype(np.float32) / 32768.0
    rms = float(np.sqrt(np.mean(x ** 2))) if len(x) else 0.0
    peak = float(np.max(np.abs(x))) if len(x) else 0.0
    print(f"packets={len(packets)} ok={ok} fail={fail} duration_s={len(pcm)/16000:.1f} rms={rms:.5f} peak={peak:.5f} out={dst} bytes={dst.stat().st_size}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
