import { h, Fragment, Component, renderSSR } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'
import { NsPage } from './ns-page.component'
import { NsStackLayout } from './ns-stack-layout.component'
import { NsFlexboxLayout } from './ns-flexbox-layout.component'
import { NsLabel } from './ns-label.component'
import { NsButton } from './ns-button.component'
import { NsTextField } from './ns-text-field.component'
import { NsImage } from './ns-image.component'
import { NsActionBar } from './ns-action-bar.component'

// Custom element-to-NativeScript-XML transformer
function customSSRTransformer(element: any): string {
    if (!element) return '';
    
    if (typeof element === 'string') return element;
    
    const tagName = element.nodeName.replace('ns-', '');
    const capitalizedTagName = tagName.charAt(0).toUpperCase() + tagName.slice(1);
    
    let attributes = '';
    if (element.attributes) {
        for (const [key, value] of Object.entries(element.attributes)) {
            if (key !== 'children' && key !== 'class') {
                attributes += ` ${key.replace(/([A-Z])/g, '-$1').toLowerCase()}="${value}"`;
            }
        }
    }
    
    let result = `<${capitalizedTagName}${attributes}>`;
    
    if (element.children) {
        for (const child of element.children) {
            result += customSSRTransformer(child);
        }
    }
    
    result += `</${capitalizedTagName}>`;
    
    return result;
}

// XML generation function
export function generateNativeScriptXml(jsx: any): string {
    const ssrOutput = renderSSR(jsx);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NativeScript xmlns:android="http://schemas.android.com/apk/res/android">
    ${ssrOutput}
</NativeScript>`;
    return xml;
}

// Components map for MDX - mapping HTML elements to NativeScript components
export const components = {
    // Root component
    NsPage: NsPage,
    
    // Heading elements
    h1: (props: any) => <NsLabel fontSize="24" fontWeight="bold" textWrap="true" marginTop="16" marginBottom="8" {...props} />,
    h2: (props: any) => <NsLabel fontSize="22" fontWeight="bold" textWrap="true" marginTop="16" marginBottom="8" {...props} />,
    h3: (props: any) => <NsLabel fontSize="20" fontWeight="bold" textWrap="true" marginTop="16" marginBottom="8" {...props} />,
    h4: (props: any) => <NsLabel fontSize="18" fontWeight="bold" textWrap="true" marginTop="14" marginBottom="8" {...props} />,
    h5: (props: any) => <NsLabel fontSize="16" fontWeight="bold" textWrap="true" marginTop="12" marginBottom="8" {...props} />,
    h6: (props: any) => <NsLabel fontSize="14" fontWeight="bold" textWrap="true" marginTop="10" marginBottom="8" {...props} />,
    
    // Text elements
    p: (props: any) => <NsLabel textWrap="true" marginTop="8" marginBottom="8" {...props} />,
    strong: (props: any) => <NsLabel fontWeight="bold" {...props} />,
    em: (props: any) => <NsLabel fontStyle="italic" {...props} />,
    
    // Lists
    ul: (props: any) => <NsStackLayout marginTop="8" marginBottom="8" marginLeft="16" {...props} />,
    ol: (props: any) => <NsStackLayout marginTop="8" marginBottom="8" marginLeft="16" {...props} />,
    li: (props: any) => <NsLabel textWrap="true" marginTop="4" marginBottom="4" text={`• ${props.children}`} {...props} />,
    
    // Media
    img: (props: any) => <NsImage stretch="aspectFit" marginTop="8" marginBottom="8" {...props} />,
    
    // Code
    pre: (props: any) => <NsLabel textWrap="true" fontSize="14" backgroundColor="#f0f0f0" padding="8" borderRadius="4" {...props} />,
    code: (props: any) => <NsLabel fontFamily="monospace" backgroundColor="#f0f0f0" {...props} />,
    
    // Tables (simplified - could be improved with a GridLayout)
    table: (props: any) => <NsStackLayout marginTop="8" marginBottom="8" {...props} />,
    tr: (props: any) => <NsFlexboxLayout marginTop="4" marginBottom="4" {...props} />,
    td: (props: any) => <NsLabel padding="4" {...props} />,
    th: (props: any) => <NsLabel fontWeight="bold" padding="4" {...props} />
}

// Main component that combines all
export default {
    generateNativeScriptXml,
    components
} 