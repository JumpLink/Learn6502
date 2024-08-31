import { Component } from 'nano-jsx/esm/index.js'
import { GtkBox } from './gtk-box.component.tsx'
import { Orientation, Align, TextListType, Justification } from '../../enums/gtk.enums.ts'

export class GtkRoot extends Component {
  render() {
    console.debug("this.props.children", this.props.children)
    console.debug("this.props.children[0].component", this.props.children[0].component)
    return <interface>
      <requires lib="gtk" version="4.0"/>
      <template class={this.props.class} parent="AdwBin">
        <property name="vexpand">true</property>
        <property name="vexpand-set">true</property>
        <GtkBox vexpand vexpand-set orientation={Orientation.VERTICAL}>
          {this.props.children}
        </GtkBox>
      </template>
    </interface>
  }
}