# Generated media fixtures

These small files are generated test patterns, not downloaded wallpapers.

- `animated.gif`: Pillow, two 96 × 96 solid red/blue frames, 200 ms each, infinite loop.
- `animated.webp`: Pillow, the same two-frame animation in WebP format.
- `animated.webm`: FFmpeg `testsrc=size=160x100:rate=10`, 2 seconds, libvpx VP8, yuv420p.
- `animated.mp4`: same testsrc, libx264 H.264, yuv420p, faststart.

FFmpeg came from the pinned imageio-ffmpeg 0.6.0 development tool. It is not
bundled with the application. The smoke script copies these fixtures to its
isolated profile and uses the actual native file-import bridge.
