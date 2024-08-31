import { Component } from 'nano-jsx/esm/index.js'

/**
 * GtkOrientable is an interface that is implemented by widgets that can be oriented.
 * @see https://docs.gtk.org/gtk4/iface.Orientable.html
 */
export class GtkOrientable extends Component {

    static propertyNames = ["orientation"]

    render() {
        return null
    }
}