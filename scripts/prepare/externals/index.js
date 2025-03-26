import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { exists } from "../exists/index.js";
import { fetchWithTimeout } from "../fetchWithTimeout/index.js";

let sources = new Map([
	[
		"kikobeats.json",
		"https://raw.githubusercontent.com/Kikobeats/top-crawler-agents/master/index.json",
	],
	[
		"monperrus.json",
		"https://raw.githubusercontent.com/monperrus/crawler-user-agents/master/crawler-user-agents.json",
	],
	[
		"matomo-org.json",
		"https://raw.githubusercontent.com/matomo-org/device-detector/master/Tests/fixtures/bots.yml",
	],
	["user-agents.net.json", "https://user-agents.net/download"],
	["myip.ms.json", "https://myip.ms/files/bots/live_webcrawlers.txt"],
]);

let { log, warn } = console;

let getters = [];

async function abort(response, collection, destination) {
	if (!response.ok) {
		warn(
			`Failed to fetch ${sources.get(collection)}: ${response.status} ${response.statusText}`,
		);
		let file = await readFile(destination, "utf8");
		if (!file.startsWith("[")) {
			throw new Error("Existing content is not a valid JSON array");
		}
		return true;
	}
	return false;
}

/**
 * Read remote file and create JSON list locally
 * @param {string} [ø.dir='..'] Destination directory
 * @param {boolean} [ø.force] Read even if file exists
 * @returns {Promise<number>}
 */
getters.push(async function monperrus({
	dir = join(__dirname, ".."),
	force = false,
} = {}) {
	let collection = "monperrus.json";
	let destination = join(dir, collection);
	if (!force && (await exists(destination))) {
		log(`Skip ${destination} - Already exists.`);
		return 0;
	}

	log(`Download content for ${destination}`);
	let response = await fetchWithTimeout(sources.get(collection));
	if ((await abort(response, collection, destination)) === true) {
		return 0;
	}
	let list = (await response.json()).map(({ instances }) => instances).flat();
	log(`Write ${destination}`);
	await writeFile(destination, JSON.stringify(list, null, 2) + "\n");
	return 1;
});

/**
 * Read remote file and create JSON list locally
 * @param {string} [ø.dir='..'] Destination directory
 * @param {boolean} [ø.force] Read even if file exists
 * @returns {Promise<number>}
 */
getters.push(async function kikobeats({
	dir = join(__dirname, ".."),
	force = false,
} = {}) {
	let collection = "kikobeats.json";
	let destination = join(dir, collection);
	if (!force && (await exists(destination))) {
		log(`Skip ${destination} - Already exists.`);
		return 0;
	}

	log(`Download content for ${destination}`);
	let response = await fetchWithTimeout(sources.get(collection));
	if ((await abort(response, collection, destination)) === true) {
		return 0;
	}
	let list = await response.json();
	log(`Write ${destination}`);
	await writeFile(destination, JSON.stringify(list, null, 2) + "\n");
	return 1;
});

/**
 * Read remote file and create JSON list locally
 * @param {string} [ø.dir='..'] Destination directory
 * @param {boolean} [ø.force] Read even if file exists
 * @returns {Promise<number>}
 */
getters.push(async function matomoOrg({
	dir = join(__dirname, ".."),
	force = false,
} = {}) {
	let collection = "matomo-org.json";
	let destination = join(dir, collection);
	if (!force && (await exists(destination))) {
		log(`Skip ${destination} - Already exists.`);
		return 0;
	}
	log(`Download content for ${destination}`);
	let response = await fetchWithTimeout(sources.get(collection));
	if ((await abort(response, collection, destination)) === true) {
		return 0;
	}
	let list = parse(await response.text()).map(
		({ user_agent }) => user_agent, // eslint-disable-line camelcase
	);
	log(`Write ${destination}`);
	await writeFile(destination, JSON.stringify(list, null, 2) + "\n");
	return 1;
});

/**
 * Read remote file and create JSON list locally
 * @param {string} [ø.dir='..'] Destination directory
 * @param {boolean} [ø.force] Read even if file exists
 * @returns {Promise<number>}
 */
getters.push(async function userAgentsNet({
	dir = join(__dirname, ".."),
	force = false,
} = {}) {
	let collection = "user-agents.net.json";
	let destination = join(dir, collection);
	if (!force && (await exists(destination))) {
		log(`Skip ${destination} - Already exists.`);
		return 0;
	}
	log(`Download content for ${destination}`);
	let response = await fetchWithTimeout(sources.get(collection), {
		method: "POST",
		body: [
			["crawler", "true"],
			["download", "json"],
		]
			.map((entry) => entry.join("="))
			.join("&"),
		headers: new Headers([
			["Content-Type", "application/x-www-form-urlencoded"],
			["User-Agent", "omrilotan/isbot"],
		]),
	});
	if ((await abort(response, collection, destination)) === true) {
		return 0;
	}
	let list = (await response.json()).filter(
		(ua) =>
			!/(\.NET CLR|^NSPlayer|RadiosNet|RMA\/|stagefright|^Sony|^UnityPlayer|^User-Agent:|^VLC\/|^Windows-Media-Player\/)/.test(
				ua,
			),
	);
	log(`Write ${destination}`);
	await writeFile(destination, JSON.stringify(list, null, 2) + "\n");
	return 1;
});

/**
 * Read remote file and create JSON list locally
 * @param {string} [ø.dir='..'] Destination directory
 * @param {boolean} [ø.force] Read even if file exists
 * @returns {Promise<number>}
 */
getters.push(async function myipMs({
	dir = join(__dirname, ".."),
	force = false,
} = {}) {
	let collection = "myip.ms.json";
	let destination = join(dir, collection);
	if (!force && (await exists(destination))) {
		log(`Skip ${destination} - Already exists.`);
		return 0;
	}
	log(`Download content for ${destination}`);
	let response = await fetchWithTimeout(sources.get(collection));
	if ((await abort(response, collection, destination)) === true) {
		return 0;
	}
	let list = (await response.text())
		.split("\n")
		.map((line) => line.split("records - ")[1])
		.filter(Boolean);
	log(`Write ${destination}`);
	await writeFile(destination, JSON.stringify(list, null, 2) + "\n");
	return 1;
});

/**
 * Read remote files and create JSON lists locally
 * @param {string} [ø.dir='..'] Destination directory
 * @param {boolean} [ø.force] Read even if file exists
 * @returns {Promise<number[]>}
 */
export let download = ({ dir, force = false } = {}) =>
	Promise.all(getters.map((fn) => fn({ dir, force })));
