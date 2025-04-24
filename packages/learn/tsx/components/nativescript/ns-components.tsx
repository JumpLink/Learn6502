import { renderSSR } from 'nano-jsx'
import { NsPage } from './ns-page.component'
import { NsHtmlView } from './ns-html-view.component'
import { NsImage } from './ns-image.component'

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
            // Only convert attribute names, not values
            const nsAttrs = attrs.replace(/\s+([a-zA-Z][a-zA-Z0-9]*)="([^"]*)"/g, (match, attrName, attrValue) => {
                // Convert camelCase attribute name to kebab-case
                const kebabAttrName = attrName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
                return ` ${kebabAttrName}="${attrValue}"`;
            });

            return `<${nsName}${nsAttrs}>`;
        })
        .replace(/<\/ns-([a-z-]+)>/g, (_, name) => {
            // Convert kebab-case to PascalCase for closing tags
            const nsName = name.split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');
            return `</${nsName}>`;
        })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    ${transformedOutput}`;
    return xml;
}

// Components map for MDX - mapping HTML elements to NativeScript components
export const components = {
    // Root component
    Page: NsPage,

    // Heading elements
    h1: (props: any) => <NsHtmlView {...props} className="title-1">{props.children}</NsHtmlView>,
    h2: (props: any) => <NsHtmlView {...props} className="title-2">{props.children}</NsHtmlView>,
    h3: (props: any) => <NsHtmlView {...props} className="title-3">{props.children}</NsHtmlView>,
    h4: (props: any) => <NsHtmlView {...props} className="title-4">{props.children}</NsHtmlView>,
    h5: (props: any) => <NsHtmlView {...props} className="title-5">{props.children}</NsHtmlView>,
    h6: (props: any) => <NsHtmlView {...props} className="title-6">{props.children}</NsHtmlView>,

    // Text elements
    p: (props: any) => <NsHtmlView {...props} className="paragraph">{props.children}</NsHtmlView>,
    // strong: (props: any) => <NsHtmlView {...props}><strong>{props.children}</strong></NsHtmlView>,
    // em: (props: any) => <NsHtmlView {...props}><em>{props.children}</em></NsHtmlView>,
    // sub: (props: any) => <small {...props}>{props.children}</small>,

    // Links
    // a: (props: any) => <NsHtmlView {...props}><a href="{props.href}">{props.children}</a></NsHtmlView>,

    // Lists
    // ul: (props: any) => <NsHtmlView {...props}><ul>{props.children}</ul></NsHtmlView>,
    ul: (props: any) => <NsHtmlView {...props} className="list"><ul>{props.children}</ul></NsHtmlView>,
    // ol: (props: any) => <NsHtmlView {...props}><ol>{props.children}</ol></NsHtmlView>,
    ol: (props: any) => <NsHtmlView {...props} className="list"><ol>{props.children}</ol></NsHtmlView>,
    // li: (props: any) => <NsHtmlView {...props}><li>{props.children}</li></NsHtmlView>,

    // Media
    img: (props: any) => <NsImage stretch="aspectFit" marginTop="8" marginBottom="8" {...props} />,

    // Code
    // pre: (props: any) => <NsSpan textWrap="true" fontSize="14" backgroundColor="#f0f0f0" padding="8" borderRadius="4" {...props} />,
    // code: (props: any) => <NsSpan fontFamily="monospace" backgroundColor="#f0f0f0" {...props} />,
    pre: (props: any) => null,
    code: (props: any) => <tt {...props}>{props.children}</tt>,

    // Tables (simplified - could be improved with a GridLayout)
    // table: (props: any) => <NsStackLayout marginTop="8" marginBottom="8" {...props} />,
    // tr: (props: any) => props.children,
    // td: (props: any) => props.children,
    // th: (props: any) => props.children,

    // TODO: This is working but we have removed it in GTK so the translation is not working
    em: (props: any) => props.children,

    strong: (props: any) => <b {...props}>{props.children}</b>,
}

// Main component that combines all
export default {
    generateNativeScriptXml,
    components
}