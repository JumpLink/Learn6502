import { h, Fragment, Component, renderSSR } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'
import { NsPage } from './ns-page.component'
import { NsStackLayout } from './ns-stack-layout.component'
import { NsFlexboxLayout } from './ns-flexbox-layout.component'
import { NsLabel } from './ns-label.component'
import { NsSpan } from './ns-span.component'
import { NsHtmlView } from './ns-html-view.component'
import { NsButton } from './ns-button.component'
import { NsTextField } from './ns-text-field.component'
import { NsImage } from './ns-image.component'
import { NsActionBar } from './ns-action-bar.component'

// Alternative implementation without DOM API (for server environments)
export function generateNativeScriptXml(jsx: any): string {
    const ssrOutput = renderSSR(jsx);
    // This is a simplification - you'd need more robust string manipulation
    // to handle complex nested structures without a DOM parser
    const transformedOutput = ssrOutput
        .replace(/<ns-([a-z-]+)([^>]*)>/g, (_, name, attrs) => {
            // Convert kebab-case to PascalCase
            const nsName = name.split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');

            // Convert camelCase attributes to kebab-case
            const nsAttrs = attrs.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

            return `<${nsName}${nsAttrs}>`;
        })
        .replace(/<\/ns-([a-z-]+)>/g, (_, name) => {
            // Convert kebab-case to PascalCase for closing tags
            const nsName = name.split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');
            return `</${nsName}>`;
        });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    ${transformedOutput}`;
    return xml;
}

// TODO: wie bei GtkLabel machen aber statt NsLabel NsHtmlView verwenden!

// Components map for MDX - mapping HTML elements to NativeScript components
export const components = {
    // Root component
    Page: NsPage,

    // Heading elements
    h1: (props: any) => <NsHtmlView {...props}><h1>{props.children}</h1></NsHtmlView>,
    h2: (props: any) => <NsHtmlView {...props}><h2>{props.children}</h2></NsHtmlView>,
    h3: (props: any) => <NsHtmlView {...props}><h3>{props.children}</h3></NsHtmlView>,
    h4: (props: any) => <NsHtmlView {...props}><h4>{props.children}</h4></NsHtmlView>,
    h5: (props: any) => <NsHtmlView {...props}><h5>{props.children}</h5></NsHtmlView>,
    h6: (props: any) => <NsHtmlView {...props}><h6>{props.children}</h6></NsHtmlView>,

    // Text elements
    p: (props: any) => <NsHtmlView {...props}><p>{props.children}</p></NsHtmlView>,
    // strong: (props: any) => <NsHtmlView {...props}><strong>{props.children}</strong></NsHtmlView>,
    // em: (props: any) => <NsHtmlView {...props}><em>{props.children}</em></NsHtmlView>,
    // sub: (props: any) => <NsHtmlView {...props}><sub>{props.children}</sub></NsHtmlView>,

    // Links
    // a: (props: any) => <NsHtmlView {...props}><a href="{props.href}">{props.children}</a></NsHtmlView>,

    // Lists
    // ul: (props: any) => <NsHtmlView {...props}><ul>{props.children}</ul></NsHtmlView>,
    ul: (props: any) => <NsHtmlView {...props}><ul>{props.children}</ul></NsHtmlView>,
    // ol: (props: any) => <NsHtmlView {...props}><ol>{props.children}</ol></NsHtmlView>,
    ol: (props: any) => <NsHtmlView {...props}><ol>{props.children}</ol></NsHtmlView>,
    // li: (props: any) => <NsHtmlView {...props}><li>{props.children}</li></NsHtmlView>,

    // Media
    img: (props: any) => <NsImage stretch="aspectFit" marginTop="8" marginBottom="8" {...props} />,

    // Code
    // pre: (props: any) => <NsSpan textWrap="true" fontSize="14" backgroundColor="#f0f0f0" padding="8" borderRadius="4" {...props} />,
    // code: (props: any) => <NsSpan fontFamily="monospace" backgroundColor="#f0f0f0" {...props} />,
    pre: (props: any) => null,
    code: (props: any) => null,

    // Tables (simplified - could be improved with a GridLayout)
    // table: (props: any) => <NsStackLayout marginTop="8" marginBottom="8" {...props} />,
    // tr: (props: any) => <NsFlexboxLayout marginTop="4" marginBottom="4" {...props} />,
    // td: (props: any) => <NsLabel padding="4" {...props} />,
    // th: (props: any) => <NsLabel fontWeight="bold" padding="4" {...props} />
}

// Main component that combines all
export default {
    generateNativeScriptXml,
    components
}