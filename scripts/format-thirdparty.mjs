import console from 'node:console';
import fs from 'node:fs';

const ALLOWED_LICENSES = [
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CDDL-1.0',
  'ISC',
  'LGPL-3.0-only',
  'MIT',
  'MPL-2.0',
  'Unlicense',
];

const input = JSON.parse(fs.readFileSync('thirdparty.json', 'utf8'));
const getVersions = pkg => pkg.version || pkg.versions?.join(', ') || 'UNKNOWN';
const packages = Object.values(input)
  .flat()
  .sort((left, right) =>
    `${left.name}@${getVersions(left)}`.localeCompare(`${right.name}@${getVersions(right)}`));

const lines = [
  '# Third-Party Notices',
  '',
  'This project includes software developed by third parties.',
  'The following licenses and notices apply.',
  '',
];
const unknownLicenses = [];

for (const pkg of packages) {
  const versions = getVersions(pkg);
  const license = pkg.license || 'UNKNOWN';
  const repository = pkg.repository || pkg.homepage || '';

  lines.push(`## ${pkg.name} ${versions}`);
  lines.push(`License: ${license}`);
  if (repository) lines.push(repository);
  lines.push('');

  if (!ALLOWED_LICENSES.includes(license)) {
    unknownLicenses.push(`${pkg.name} ${versions}: ${license}`);
  }
}

fs.writeFileSync('THIRD_PARTY_NOTICES.md', lines.join('\n'));

if (unknownLicenses.length > 0) {
  console.warn('Warning: The following packages have unknown or disallowed licenses:');
  for (const entry of unknownLicenses) {
    console.warn(` - ${entry}`);
  }
}
