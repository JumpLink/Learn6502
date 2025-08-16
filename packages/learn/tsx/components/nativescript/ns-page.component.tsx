import { Component } from "nano-jsx";

export class NsPage extends Component {
  static propertyNames = ["actionBarHidden"];

  static reservedPropertyNames = [];

  static defaultProps = {};

  constructor(props: any) {
    super(props);
  }

  public render() {
    // Using JSX to define the structure that will be parsed by renderSSR
    return <ns-page {...this.props}>{this.props.children}</ns-page>;
  }
}
