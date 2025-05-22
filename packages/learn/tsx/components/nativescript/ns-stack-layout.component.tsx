import { Component } from "nano-jsx";

export class NsStackLayout extends Component {
  static propertyNames = ["orientation"];

  static defaultProps = {
    orientation: "vertical",
  };

  constructor(props: any) {
    super(props);
  }

  public render() {
    // Using JSX to define the structure that will be parsed by renderSSR
    return (
      <ns-stack-layout {...this.props}>{this.props.children}</ns-stack-layout>
    );
  }
}
