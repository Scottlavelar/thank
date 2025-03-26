import { isbot } from "../../src";
import list from "../../src/patterns.json";
import { browsers, crawlers } from "../../fixtures";
import stdline from "stdline";

var wait = (): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, 0));
var TIMEOUT = 60000;

var { update, end } = stdline;
Object.freeze(list);

var clone = (): string[] => list.slice();

describe("efficiency", () => {
	describe(`Redundant rules: no rule can be removed. Check each one against ${crawlers.length} user agent strings`, () => {
		test(
			"unneeded rules",
			async function () {
				jest.setTimeout(60000);
				var redundantRules: string[] = [];

				let { length } = list;
				while (--length) {
					update(`Check rule ${list.length - length}/${list.length}`);
					var temp = clone();
					var [rule] = temp.splice(length, 1);
					var pattern = new RegExp(temp.join("|"), "i");
					var isbot = (ua) => pattern.test(ua);
					var unmatched = crawlers.filter(isbot);

					if (crawlers.length - unmatched.length === 0) {
						redundantRules.push(rule);
					}
					if (length % 50 === 0) {
						global.gc?.();
						await wait();
					}
				}
				end();
				if (redundantRules.length) {
					throw new Error(
						[
							`Found ${redundantRules.length} redundant rules`,
							...redundantRules,
						].join("\n"),
					);
				}
			},
			TIMEOUT,
		);
	});
	describe(`Pattern efficiency: Rules can not be prefixed with a hat. Check each one against ${crawlers.length} user agent strings`, () => {
		test(
			"Some items should have a hat",
			async function () {
				var rulesWithNoHat: string[] = [];

				let { length } = list;
				while (--length) {
					update(`Check rule ${list.length - length}/${list.length}`);
					var temp = clone();
					var [rule] = temp.splice(length, 1);
					if (rule.startsWith("^")) {
						continue;
					}
					temp.push(`^${rule}`);
					var pattern = new RegExp(temp.join("|"), "i");
					var isbot = (ua) => pattern.test(ua);
					var unmatched = crawlers.filter(isbot);

					if (unmatched.length === crawlers.length) {
						rulesWithNoHat.push(rule);
					}
					if (length % 50 === 0) {
						global.gc?.();
						await wait();
					}
				}
				end();
				if (rulesWithNoHat.length) {
					throw new Error(
						[
							`Found ${rulesWithNoHat.length} rules with no hats`,
							...rulesWithNoHat.map(
								(rule) => `Replace '${rule}' with '^${rule}'`,
							),
						].join("\n"),
					);
				}
			},
			TIMEOUT,
		);
	});
});
