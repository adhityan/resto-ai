import Handlebars from "handlebars";

/**
 * Compiles and renders a Handlebars template with the given variables.
 */
export function renderTemplate(
    template: string,
    variables: Record<string, unknown>
): string {
    const compiled = Handlebars.compile(template);
    return compiled(variables);
}

/**
 * Creates a template renderer with cached compilation for repeated use.
 */
export class TemplateRenderer {
    private readonly cache = new Map<string, HandlebarsTemplateDelegate>();
    private readonly variables: Record<string, unknown>;

    constructor(parameters?: Record<string, unknown>) {
        this.variables = parameters ?? {};
    }

    private compile(template: string): HandlebarsTemplateDelegate {
        const cached = this.cache.get(template);
        if (cached) return cached;

        const compiled = Handlebars.compile(template);
        this.cache.set(template, compiled);
        return compiled;
    }

    render(template: string): string {
        return this.compile(template)(this.variables);
    }

    /**
     * Sets or updates a parameter value.
     */
    setParameter(key: string, value: unknown): void {
        this.variables[key] = value;
    }
}
