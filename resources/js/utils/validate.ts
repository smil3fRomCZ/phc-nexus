type Rule = (value: string) => string | null;

export const required =
    (msg?: string): Rule =>
    (v) =>
        v.trim() ? null : (msg ?? 'This field is required');

export const maxLength =
    (max: number): Rule =>
    (v) =>
        v.length > max ? `Max ${max} characters` : null;

export const pattern =
    (regex: RegExp, msg: string): Rule =>
    (v) =>
        v.length === 0 || regex.test(v) ? null : msg;

export function validate(value: string, rules: Rule[]): string | null {
    for (const rule of rules) {
        const error = rule(value);
        if (error) return error;
    }
    return null;
}
