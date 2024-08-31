import { Component } from 'nano-jsx/esm/index.js'

export class GtkRoot extends Component {
  render() {
    console.debug("this.props.children", this.props.children)
    console.debug("this.props.children[0].component", this.props.children[0].component)
    return <interface>
      <requires lib="gtk" version="4.0"/>
      <template class={this.props.class} parent="AdwBin">
        <property name="vexpand">true</property>
        <property name="vexpand-set">true</property>
        <child>
          <object class="GtkBox">
            <property name="vexpand">true</property>
            <property name="vexpand-set">true</property>
            <property name="orientation">1</property>
            {this.props.children}
          </object>
        </child>
      </template>
    </interface>
  }
}