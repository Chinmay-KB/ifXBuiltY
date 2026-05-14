#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const DEFAULT_PORT = 3002;
const port = Number(process.env.LIGHTHOUSE_PORT ?? DEFAULT_PORT);
const explicitUrl = process.env.LIGHTHOUSE_URL ?? process.argv[2];
const url = explicitUrl ?? `http://localhost:${port}/`;
const shouldManageServer = !explicitUrl;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio ?? "inherit",
    shell: false,
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}

async function waitForServer(targetUrl, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(targetUrl, { method: "HEAD" });
      if (response.ok || response.status < 500) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${targetUrl}`);
}

function summarizeReport(rawReport) {
  const report = JSON.parse(rawReport.slice(rawReport.indexOf("{"), rawReport.lastIndexOf("}") + 1));
  const audits = report.audits;
  const metricKeys = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "speed-index",
    "total-blocking-time",
    "cumulative-layout-shift",
  ];

  return {
    url: report.finalDisplayedUrl,
    score: Math.round(report.categories.performance.score * 100),
    metrics: Object.fromEntries(
      metricKeys.map((key) => [
        key,
        {
          value: audits[key]?.displayValue,
          score: audits[key]?.score,
        },
      ]),
    ),
    opportunities: Object.values(audits)
      .filter((audit) => audit.details?.type === "opportunity" && audit.numericValue > 0)
      .map((audit) => ({
        title: audit.title,
        savingsMs: Math.round(audit.numericValue),
      }))
      .sort((a, b) => b.savingsMs - a.savingsMs)
      .slice(0, 8),
  };
}

let server;

try {
  if (shouldManageServer) {
    run("yarn", ["build"]);
    server = spawn("yarn", ["start", "-p", String(port)], {
      stdio: ["ignore", "inherit", "inherit"],
      shell: false,
    });
    await waitForServer(url);
  }

  const lighthouse = run(
    "yarn",
    [
      "dlx",
      "--quiet",
      "lighthouse",
      url,
      "--only-categories=performance",
      "--form-factor=mobile",
      "--screenEmulation.mobile=true",
      "--screenEmulation.width=412",
      "--screenEmulation.height=915",
      "--screenEmulation.deviceScaleFactor=2.625",
      "--throttling.cpuSlowdownMultiplier=4",
      "--throttling-method=simulate",
      "--chrome-flags=--headless",
      "--output=json",
      "--quiet",
    ],
    { stdio: "pipe" },
  );

  console.log(JSON.stringify(summarizeReport(lighthouse.stdout), null, 2));
} finally {
  server?.kill("SIGTERM");
}
