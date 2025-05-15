import { Component } from "nano-jsx";
import { NsStackLayout } from "./ns-stack-layout.component";

export class NsRoot extends Component {
  static propertyNames = [
    "text",
    "textWrap",
    "fontSize",
    "fontWeight",
    "textAlignment",
  ];

  static defaultProps = {
    textWrap: "true",
  };

  constructor(props: any) {
    super(props);
  }

  public render() {
    const props = {
      ...NsRoot.defaultProps,
      ...this.props,
    };
    return (
      <NsStackLayout
        xmlns="http://schemas.nativescript.org/tns.xsd"
        xmlns:w="~/widgets/index"
        {...props}
      >
        {this.props.children}
      </NsStackLayout>
    );
  }
}
