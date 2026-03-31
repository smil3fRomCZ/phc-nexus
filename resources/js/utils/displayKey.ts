/**
 * JIRA-style identifikátor: "{PROJECT_KEY}-{number}"
 */
export function displayKey(projectKey: string, number: number): string {
    return `${projectKey}-${number}`;
}
