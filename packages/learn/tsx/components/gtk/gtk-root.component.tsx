import { Component } from "nano-jsx/esm/index.js";
import { GtkBox } from "./gtk-box.component.tsx";
import { Orientation, Align, TextListType, Justification } from "../../enums/gtk.enums.ts";

export class GtkRoot extends Component {
  render() {
    return (
      <interface>
        <requires lib="gtk" version="4.0" />
        <template class={this.props.class} parent="MdxView">
          <property name="vexpand">true</property>
          <GtkBox vexpand orientation={Orientation.VERTICAL}>
            {this.props.children}
          </GtkBox>
        </template>
      </interface>
    );
  }
}