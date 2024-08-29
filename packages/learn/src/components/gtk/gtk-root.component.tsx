import { Component } from 'nano-jsx/esm/index.js'

export class GtkRoot extends Component {
  render() {
    console.debug("this.props.children", this.props.children)
    return <interface>
      <requires lib="gtk" version="4.0"/>
      <template class={this.props.class} parent="AdwBin">
        <child>
          <object class="GtkBox">
            <property name="orientation">1</property>
            {this.props.children}
          </object>
        </child>
      </template>
    </interface>
  }
}