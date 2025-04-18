import { Component } from 'nano-jsx'

export class NsWidget extends Component {
    static propertyNames = [
        "id", "height", "width", "backgroundColor", "color", 
        "margin", "padding", "horizontalAlignment", "verticalAlignment",
        "visibility", "opacity", "className"
    ]

    static reservedPropertyNames = ["children", "class"]

    static defaultProps = {
        
    }

    constructor(props: any) {
        super(props)
    }

    // The standard render method that returns JSX
    public render() {
        // Placeholder implementation that subclasses will override
        return <ns-widget />
    }

    // Helper for generating property attributes
    protected getPropertyElements() {
        const propKeys = Object.keys(this.props)
        return propKeys.map(property => {
            if (this.constructor['propertyNames'].includes(property)) {
                return this.props[property] !== undefined ? 
                    ` ${this.toKebabCase(property)}="${this.props[property].toString()}"` : null
            }
            if (this.constructor['reservedPropertyNames'].includes(property)) {
                return null
            }
            console.warn(`[${this.constructor.name}] Ignore unknown property: ${property}`)
            return null
        }).filter(item => item !== null).join('')
    }

    protected toKebabCase(str: string): string {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    }
} 