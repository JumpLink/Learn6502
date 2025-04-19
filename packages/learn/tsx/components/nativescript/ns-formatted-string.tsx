import { Component, renderSSR } from 'nano-jsx'

export class NsFormattedString extends Component {

    constructor(props: any) {
        super(props)
    }

    public render() {
        return (
            <ns-formatted-string {...this.props}/>
        )
    }
}