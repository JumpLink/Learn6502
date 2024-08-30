import { Component } from 'nano-jsx/esm/index.js'

export class GtkRoot extends Component {
    render() {
        return <interface>
          <requires lib="gtk" version="4.0"/>
          <object class="GtkBox" id="welcome"></object>
          {this.props.children}
        </interface>
    }
}