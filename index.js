const { promisify } = require('util');
const { join } = require('path');
const { readdir, readFile, writeFile } = require('fs');
const xml2js = require('xml2js');

const readDirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const parseXml = promisify(xml2js.parseString);

const verbose = false;

async function getRuleFiles() {
	const rulesDir = join(__dirname, 'https-everywhere', 'rules');
	return readDirAsync(rulesDir);
}

async function writePackage(rules = [], file = 'https-everywhere.1blockpkg', prettyPrint = true) {
	const pkg = [{
		name: 'HTTPS Everywhere',
		rules
	}];

	const packageFile = join(__dirname, file);
	const json = JSON.stringify(pkg, null, prettyPrint ? '\t' : null);
	return writeFileAsync(packageFile, json);
}

function makeRule(name, domains) {
	return {
		name: `${name}`,
		content: {
			action: {
				type: 'make-https'
			},
			trigger: {
				'url-filter-is-case-sensitive': true,
				'url-filter': '.*',
				'if-domain': domains
			}
		}
	};
}

function rulesetHasRewrites(ruleset) {
	for (const { $: { from, to } } of ruleset.rule) {
		if (from !== '^http:' && to !== 'https:') {
			return true;
		}
	}

	return false;
}

function shouldSkipRuleset(ruleset) {
	const name = ruleset.$.name;

	if (rulesetHasRewrites(ruleset)) {
		if (verbose) {
			console.log(`${name} rules contain rewrites`);
		}

		return true;
	}

	const offByDefault = ruleset.$.default_off;
	const mixedContent = ruleset.$.platform === 'mixedcontent';

	if (offByDefault || mixedContent) {
		if (verbose) {
			console.log(`${name} is off by default because "${offByDefault}"`);
		}

		return true;
	}

	return false;
}

async function main() {
	const ruleFiles = await getRuleFiles();

	const rulePromises = ruleFiles.map(async (file) => {
		const absoluteFilePath = join(__dirname, 'https-everywhere', 'rules', file);
		const contents = await readFileAsync(absoluteFilePath);

		try {
			const rule = await parseXml(`${contents}`.trim());

			if (!rule) {
				return;
			}

			const ruleset = rule.ruleset;

			if (shouldSkipRuleset(ruleset)) {
				return;
			}

			const name = ruleset.$.name;
			const targets = ruleset.target.map((target) => target.$.host);

			return { name, targets };
		}
		catch (err) {
			console.log(`error with ${absoluteFilePath}`);
		}
	});

	const processedRules = await Promise.all(rulePromises);
	const validRules = processedRules.filter((rule) => rule !== undefined);
	const rules = [];
	const domains = [];

	for (const { name, targets } of validRules) {
		rules.push(makeRule(name, targets));
		domains.push(...targets);
	}

	// Make a package that is a single rule with all the domains
	domains.sort();
	await writePackage([makeRule('HTTPS Everywhere', domains)]);

	// Make a package that has a separate rule for each https everywhere rule
	await writePackage(rules, 'https-everywhere-individual.1blockpkg');
}

main();
