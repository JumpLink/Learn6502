export interface XGettextPluginOptions {
    sources: string[];
    output: string;
    domain?: string;
    keywords?: string[];
    xgettextOptions?: string[];
    verbose?: boolean;
  }
  
  export interface GettextPluginOptions {
    poDirectory: string;
    moDirectory: string;
    verbose?: boolean;
  }