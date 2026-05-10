// ArcGIS Portal REST API — Search reference:
// https://developers.arcgis.com/rest/users-groups-and-items/search-reference.htm
const API_URL =
    'https://geoportal.un.org/arcgis/sharing/rest/search?f=json&q=(type:%22geojson%22)%20AND%20(title:%22*geodata*%22)&sortField=modified&sortOrder=desc';

export default async function checkUnGeodata({ github, context, core }) {
    // Fetch the UN Geodata API
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    const data = await res.json();
    const newest = data.results[0];
    if (!newest) throw new Error('No results returned from API');

    const marker = `<!-- un-geodata-modified:${newest.modified} -->`;

    // Check if we already created an issue for this modified timestamp
    const { data: issues } = await github.rest.issues.listForRepo({
        owner: context.repo.owner,
        repo: context.repo.repo,
        labels: 'topojson',
        state: 'all',
        sort: 'created',
        direction: 'desc',
        per_page: 100
    });

    if (issues.some((issue) => issue.body?.includes(marker))) {
        core.info('No new updates — issue already exists for this timestamp');
        return;
    }

    // Build the issue body
    const summary = data.results
        .map((r) => {
            const date = new Date(r.modified).toISOString().slice(0, 10);
            return `- **${r.title}** (modified: ${date}, id: \`${r.id}\`)`;
        })
        .join('\n');

    const body = [
        marker,
        '',
        `The [UN Geoportal geodata API](${API_URL}) has new or updated artifacts.`,
        '',
        `### Datasets found (${data.total}):`,
        summary,
        '',
        '### Next steps',
        '- Review the updated dataset at the [UN Geoportal](https://geoportal.un.org/)',
        '- Determine if `topojson/` sources need updating',
        '',
        '---',
        `*This issue was created automatically by the [Check UN Geodata Updates](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/workflows/check-un-geodata.yml) workflow.*`
    ].join('\n');

    await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `UN Geodata update detected: ${newest.title}`,
        body,
        labels: ['topojson']
    });
}
