#!/usr/bin/env python3
"""Capture a page and browser errors. This is reconnaissance, not a UI test suite."""
import argparse
import json
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--wait-for", help="CSS selector marking the page ready")
    parser.add_argument("--timeout", type=int, default=30000, help="Timeout in milliseconds")
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("--timeout must be positive")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright is unavailable in this Python interpreter. Use the project's configured environment.", file=sys.stderr)
        return 2

    output = Path(args.output_dir).resolve()
    output.mkdir(parents=True, exist_ok=True)
    screenshot = output / "page.png"
    report_path = output / "report.json"
    # A failed run must not leave an older screenshot looking like new evidence.
    screenshot.unlink(missing_ok=True)
    report = {"requestedUrl": args.url, "pageErrors": [], "consoleErrors": [], "failedRequests": [], "httpErrors": [], "screenshot": None, "error": None, "scope": "Page reconnaissance only; no business-flow or visual assertions."}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                context = browser.new_context(viewport={"width": 1280, "height": 800})
                page = context.new_page()
                page.set_default_timeout(args.timeout)
                page.on("pageerror", lambda error: report["pageErrors"].append(str(error)))
                page.on("console", lambda message: report["consoleErrors"].append(message.text) if message.type == "error" else None)
                page.on("requestfailed", lambda request: report["failedRequests"].append({"url": request.url, "failure": request.failure}))
                page.on("response", lambda response: report["httpErrors"].append({"url": response.url, "status": response.status}) if response.status >= 400 else None)
                response = page.goto(args.url, wait_until="domcontentloaded", timeout=args.timeout)
                if args.wait_for:
                    page.locator(args.wait_for).first.wait_for(state="visible")
                report.update({"url": page.url, "title": page.title(), "status": response.status if response else None})
                page.screenshot(path=str(screenshot), full_page=True)
                report["screenshot"] = str(screenshot)
            finally:
                browser.close()
    except Exception as error:
        report["error"] = str(error)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(str(report_path))
    return 1 if report["error"] or report["pageErrors"] or report["consoleErrors"] or report["failedRequests"] or report["httpErrors"] else 0


if __name__ == "__main__":
    sys.exit(main())
