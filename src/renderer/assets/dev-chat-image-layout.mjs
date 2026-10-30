// Shared presentation for attachments and Markdown images. Image loading and
// session file permissions stay in the existing ChatImage component.
export function createChatImagePresentation(React, ChatImage, Preview, { useSessionId, localPath, isEnglish }) {
  const h = React.createElement;
  function ImageCard({ src, name, isSingle = true, onPreview, onContextMenu, feedback, english = false }) {
    const frame = React.useRef(null);
    const [width, setWidth] = React.useState(0);
    const [natural, setNatural] = React.useState(null);
    const [expandedSource, setExpandedSource] = React.useState(null);
    React.useEffect(() => {
      const element = frame.current;
      if (!element) return;
      const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
      observer.observe(element);
      return () => observer.disconnect();
    }, []);
    const dimensions = natural?.src === src ? natural : null;
    const limit = isSingle ? 560 : 420;
    // Only long screenshots need a bounded preview. Ordinary portraits and
    // landscape images remain fully visible at their original aspect ratio.
    const long = !!dimensions && dimensions.height / dimensions.width > 2
      && dimensions.height * Math.min(1, width / dimensions.width) > limit;
    const expanded = expandedSource === src;
    const label = english ? 'View full size' : '点击放大';
    return h('span', {
      ref: frame,
      className: 'shine-chat-image-card' + (isSingle ? ' is-single' : '') + (long ? ' is-long' : '') + (expanded ? ' is-expanded' : ''),
      'data-chat-image': name,
      onContextMenu
    },
      h('button', {
        type: 'button', className: 'shine-chat-image-open',
        onClick: () => onPreview(src), 'aria-label': `${label}：${name}`, title: label
      },
        h('span', { className: 'shine-chat-image-viewport', style: { maxHeight: long && expanded ? 'none' : `${limit}px` } },
          h(ChatImage, {
            src, alt: name, loading: 'lazy', draggable: false,
            className: 'shine-chat-image-content',
            style: long ? { width: `min(100%, ${dimensions.width}px)`, maxHeight: 'none' } : { maxHeight: `${limit}px` },
            onLoad: event => {
              const image = event.currentTarget;
              setNatural({ src, width: image.naturalWidth, height: image.naturalHeight });
            }
          }),
          long && !expanded && h('span', { className: 'shine-chat-image-continuation', 'aria-hidden': true }, english ? 'Long image · expand below' : '长图 · 可在下方展开')
        )
      ),
      h('span', { className: 'shine-chat-image-caption' },
        h('span', { className: 'shine-chat-image-name', title: name }, name),
        long && h('button', {
          type: 'button', className: 'shine-chat-image-expand', 'aria-expanded': expanded,
          onClick: () => setExpandedSource(expanded ? null : src)
        }, expanded ? (english ? 'Collapse image' : '收起长图') : (english ? 'Expand full image' : '展开完整图片'))
      ),
      feedback && h('span', { className: 'shine-chat-image-feedback', role: 'status' }, feedback.message)
    );
  }
  function MarkdownImage({ src = '', alt = '', title }) {
    const [preview, setPreview] = React.useState(null);
    const sessionId = useSessionId();
    const english = isEnglish();
    const name = alt || title || (english ? 'Image' : '图片');
    return h(React.Fragment, null,
      h(ImageCard, { src, name, onPreview: setPreview, english }),
      h(Preview, { imageUrl: preview, imagePath: localPath(src) || undefined, sessionId, onClose: () => setPreview(null) })
    );
  }
  return { ImageCard, MarkdownImage };
}
