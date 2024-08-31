import { Component, renderSSR } from 'nano-jsx/esm/index.js'
import { GtkLabel } from './gtk-label.component.tsx'
import { GtkBox } from './gtk-box.component.tsx'
import { clearExtraSpaces, filterProperties } from '../../utils.ts'
import { Orientation, Align, TextListType } from '../../enums/gtk.enums.ts'

export class GtkTextList extends Component {
    static propertyNames = [...GtkBox.propertyNames]

    static reservedPropertyNames = [...GtkBox.reservedPropertyNames, 'type']

    static defaultProps = {
        ...GtkBox.defaultProps,
        type: TextListType.ORDERED,
    }

    constructor(props: any) {
        super(props)
        this.GtkTextList()
    }

    render() {
        let index = 1;
        const listItems = this.props.children.map((child) => {
            const content = clearExtraSpaces(renderSSR(child));
            if (!content) {
                return null;
            }
            const item = {
                index,
                content,
            }
            index++;
            return item;
        }).filter(item => item !== null);

        // TODO: Implement RTL support
        return (
            <GtkBox orientation={Orientation.VERTICAL} margin-start={24} {...filterProperties(this.props, GtkTextList.propertyNames)}>
                    {listItems.map(item => (
                        <GtkBox orientation={Orientation.HORIZONTAL}>
                            <GtkLabel
                                use-markup
                                wrap
                                xalign={Align.FILL}
                                valign={Align.START}
                                label={`${this.props.type === TextListType.ORDERED ? item.index + '.' : '•'} `}
                            />
                            <GtkLabel
                                use-markup
                                wrap
                                xalign={Align.FILL}
                                valign={Align.START}
                                label={item.content}
                            />
                         </GtkBox>
                    ))}
            </GtkBox>
        );
    }

    protected GtkTextList(): void {
        this.props = {
            ...GtkTextList.defaultProps,
            ...this.props,
        }
    }
}