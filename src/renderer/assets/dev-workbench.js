// Reserve the composer's actual height (including wrapped controls and the
// optional setup hint), rather than assuming a fixed input size at startup.
export function bindWorkbenchLayout(stage, composer) {
  if (!stage || !composer) return () => {};
  const update = () => {
    const height = Math.ceil(composer.getBoundingClientRect().height) + 40;
    stage.style.setProperty('--workbench-composer-space', `${height}px`);
  };
  const observer = new ResizeObserver(update);
  observer.observe(stage);
  observer.observe(composer);
  update();
  return () => {
    observer.disconnect();
    stage.style.removeProperty('--workbench-composer-space');
  };
}
