# -*- coding: utf-8 -*-
"""Local faster-whisper sidecar for ShineAI recorder (P1)."""
import json
import sys


def encode_payload(texts, out_segments) -> bytes:
    # ponytail: ASCII JSON so Windows cp936 stdout cannot mojibake 中文
    payload = json.dumps({'text': ' '.join(texts).strip(), 'segments': out_segments}, ensure_ascii=True)
    return payload.encode('ascii')


def transcribe_file(model, audio: str, language, use_vad: bool, voiceprint=None):
    segments, _info = model.transcribe(
        audio,
        language=language or None,
        vad_filter=use_vad,
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
    )
    out_segments = []
    texts = []
    repeat = 0
    for seg in segments:
        text = (seg.text or '').strip()
        if not text:
            continue
        # 长静音里 Whisper 会原地复读（如整屏「赶紧」）；同句连续出现超过 2 次后丢弃
        repeat = repeat + 1 if texts and texts[-1] == text else 0
        if repeat >= 2:
            continue
        texts.append(text)
        out_segments.append({
            'startMs': int(seg.start * 1000),
            'endMs': int(seg.end * 1000),
            'text': text,
        })
    if voiceprint:
        from speaker_id import label_segments
        label_segments(audio, out_segments, voiceprint)
    return encode_payload(texts, out_segments)


def load_model(model_name: str):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print('缺少 faster-whisper。请执行: pip install faster-whisper', file=sys.stderr)
        raise SystemExit(3)
    return WhisperModel(model_name, device='cpu', compute_type='int8')


def serve(model_name: str, language) -> int:
    model = load_model(model_name)
    sys.stderr.write('whisper-ready\n')
    sys.stderr.flush()
    for line in sys.stdin:
        audio = line.strip()
        if not audio:
            continue
        if audio == 'QUIT':
            return 0
        sys.stdout.buffer.write(transcribe_file(model, audio, language, use_vad=False) + b'\n')
        sys.stdout.buffer.flush()
    return 0


def main() -> int:
    if len(sys.argv) < 2:
        print('usage: whisper_transcribe.py <audio|--serve> [model] [language] [voiceprint.json]', file=sys.stderr)
        return 2
    model_name = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else 'small'
    language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
    if sys.argv[1] == '--serve':
        return serve(model_name, language)
    audio = sys.argv[1]
    model = load_model(model_name)
    voiceprint = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else None
    sys.stdout.buffer.write(transcribe_file(model, audio, language, use_vad=True, voiceprint=voiceprint))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
