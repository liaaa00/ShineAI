import { c as createFlowDiagram, s as styles_default } from "./flowDiagram-OXPTDLAJ-BicKyOLg.js";
import { _ as __name } from "./mermaid.core-CkVK92VJ.js";
import "./index-0LVJEr5c.js";
import "./chunk-5VM5RSS4-CFgiB7GA.js";
import "./chunk-XXDRQBXY-CNTZkGp6.js";
import "./chunk-KQW6MTUR-CWykCBJ6.js";
import "./chunk-7TKQ45FW-BtqEg1rm.js";
import "./channel-FeMJDjV4.js";
var getStyles = /* @__PURE__ */ __name((options) => `${styles_default(options)}
  .swimlane.cluster:not([data-color-id]) rect {
    stroke: ${options.clusterBorder} !important;
  }
  [data-look="neo"].cluster rect {
    filter: none;
  }
`, "getStyles");
var styles_default2 = getStyles;
var diagram = createFlowDiagram({ styles: styles_default2 });
export {
  diagram
};
