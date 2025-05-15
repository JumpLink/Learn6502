import { NsHtmlView } from "./ns-html-view.component.tsx";
import { CodeType } from "../../enums/gtk.enums.ts";
import { Component } from "nano-jsx/esm/index.js";

// TODO implement this based on GtkCode
export class NsCode extends Component {
  constructor(props: any) {
    super(props);
  }

  render() {
    return <NsHtmlView {...this.props}>{this.props.children}</NsHtmlView>;
  }
}
