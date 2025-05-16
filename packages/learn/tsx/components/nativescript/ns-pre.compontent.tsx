import { NsHtmlView } from "./ns-html-view.component.tsx";
import { NsCode } from "./ns-code.compontent.tsx";
import { CodeType } from "../../enums/gtk.enums.ts";
import { Component } from "nano-jsx/esm/index.js";

export class NsPre extends Component {
  constructor(props: any) {
    super(props);
  }

  render() {
    // If the first child is a code component, return it without the pre tag
    if (
      this.props.children.length > 0 &&
      this.props.children[0].component === NsCode
    ) {
      // Force the code component to be rendered as a block because it's part of a preformatted text block
      this.props.children[0].props.type = CodeType.BLOCK;
      return this.props.children[0];
    }
    return (
      <NsHtmlView {...this.props}>
        <pre>{this.props.children}</pre>
      </NsHtmlView>
    );
  }
}
