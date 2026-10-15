# -*- coding: utf-8 -*-
"""声纹：录入本人声音 + 给转录分段打「我 / 他人」标签。依赖 sherpa-onnx + 3D-Speaker CAM++（中英）。

  python speaker_id.py enroll <audio> <voiceprint.json> <model.onnx>
"""
import json
import os
import sys
import urllib.request

MODEL_URL = ('https://github.com/k2-fsa/sherpa-onnx/releases/download/speaker-recongition-models/'
             '3dspeaker_speech_campplus_sv_zh_en_16k-common_advanced.onnx')
SR = 16000
# 实测（桌边+短剧背景）：本人 0.62~0.97，电视台词 ≤0.52
# ponytail: 阈值写死；误判多了再挪进设置页
ME_THRESHOLD = 0.55
MIN_SEG_SEC = 0.8


def ensure_model(model_path: str) -> str:
    if not os.path.exists(model_path):
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        tmp = model_path + '.part'
        urllib.request.urlretrieve(MODEL_URL, tmp)
        os.replace(tmp, model_path)
    return model_path


def extractor(model_path: str):
    try:
        import sherpa_onnx
    except ImportError:
        print('缺少 sherpa-onnx。请执行: pip install sherpa-onnx', file=sys.stderr)
        raise SystemExit(3)
    cfg = sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=ensure_model(model_path), num_threads=2)
    return sherpa_onnx.SpeakerEmbeddingExtractor(cfg)


def embed(ex, samples):
    import numpy as np
    stream = ex.create_stream()
    stream.accept_waveform(SR, samples)
    stream.input_finished()
    vec = np.array(ex.compute(stream), dtype='float32')
    return vec / (np.linalg.norm(vec) or 1.0)


def enroll(audio: str, out_path: str, model_path: str) -> int:
    import numpy as np
    from faster_whisper.audio import decode_audio
    from faster_whisper.vad import VadOptions, get_speech_timestamps
    samples = decode_audio(audio, sampling_rate=SR)
    spans = get_speech_timestamps(samples, VadOptions(min_silence_duration_ms=300))
    speech = np.concatenate([samples[s['start']:s['end']] for s in spans]) if spans else samples
    if len(speech) < SR * 5:
        print('有效人声不足 5 秒，请对着设备多说几句再录', file=sys.stderr)
        return 4
    vec = embed(extractor(model_path), speech)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'model': model_path, 'speechSec': round(len(speech) / SR, 1), 'embedding': vec.tolist()}, f)
    print(json.dumps({'ok': True, 'speechSec': round(len(speech) / SR, 1)}))
    return 0


def label_segments(audio: str, out_segments, voiceprint_path: str) -> None:
    """就地给分段加 speaker（me/other，短句不判）与 speakerScore；缺依赖或未录入时静默跳过。"""
    if not voiceprint_path or not os.path.exists(voiceprint_path) or not out_segments:
        return
    try:
        import numpy as np
        from faster_whisper.audio import decode_audio
        with open(voiceprint_path, encoding='utf-8') as f:
            vp = json.load(f)
        me = np.array(vp['embedding'], dtype='float32')
        ex = extractor(vp['model'])
        samples = decode_audio(audio, sampling_rate=SR)
    except (Exception, SystemExit) as err:  # noqa: BLE001 — 声纹是增强项，缺依赖/模型也不影响转录
        print(f'speaker label skipped: {err!r}', file=sys.stderr)
        return
    for seg in out_segments:
        # Whisper 时间戳可能超出音频末尾，先截到实际长度
        a, b = seg['startMs'] * SR // 1000, min(seg['endMs'] * SR // 1000, len(samples))
        if (b - a) < SR * MIN_SEG_SEC:
            continue
        try:
            score = float(me @ embed(ex, samples[a:b]))
        except Exception:  # noqa: BLE001
            continue
        seg['speaker'] = 'me' if score >= ME_THRESHOLD else 'other'
        seg['speakerScore'] = round(score, 3)


if __name__ == '__main__':
    if len(sys.argv) == 5 and sys.argv[1] == 'enroll':
        raise SystemExit(enroll(sys.argv[2], sys.argv[3], sys.argv[4]))
    print(__doc__, file=sys.stderr)
    raise SystemExit(2)
