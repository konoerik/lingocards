#!/usr/bin/env python3
"""
Capture screenshots of the app across device viewports using Playwright.

Starts its own HTTP server (port 8765) — no need to run the dev server first.
Output: screenshots/chromium/<device>.png  screenshots/webkit/<device>.png

Usage:
  .venv/bin/python scripts/screenshot_devices.py
  .venv/bin/python scripts/screenshot_devices.py --url http://localhost:8080

Requires:
  .venv/bin/pip install playwright
  .venv/bin/playwright install chromium webkit
"""

import argparse
import http.server
import os
import socketserver
import threading
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT  = ROOT / 'screenshots'
PORT = 8765

# (label, width, height, device_scale_factor)
DEVICES = [
    ('iphone-se-3rd',      375,  667, 2),
    ('iphone-14',          390,  844, 3),
    ('iphone-17-pro-max',  430,  956, 3),
    ('pixel-7',            412,  915, 2),
    ('galaxy-s24',         360,  780, 3),
    ('galaxy-a54',         360,  800, 2),
    ('ipad-10th',          820, 1180, 2),
    ('macbook-air-13',    1280,  800, 2),
    ('desktop-1440',      1440,  900, 1),
]

BROWSERS = ['chromium', 'webkit']


def _start_server(port):
    handler = http.server.SimpleHTTPRequestHandler
    handler.log_message = lambda *args: None
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', port), handler) as httpd:
        httpd.serve_forever()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--url', default=f'http://localhost:{PORT}', help='App URL (default: starts own server)')
    args = parser.parse_args()

    if args.url == f'http://localhost:{PORT}':
        os.chdir(ROOT)
        threading.Thread(target=_start_server, args=(PORT,), daemon=True).start()
        import time; time.sleep(0.3)  # give server a moment to bind

    from playwright.sync_api import sync_playwright

    total = 0
    with sync_playwright() as p:
        for browser_name in BROWSERS:
            launcher = getattr(p, browser_name)
            browser  = launcher.launch()
            print(f'\n{browser_name}')
            for label, width, height, dpr in DEVICES:
                ctx  = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=dpr)
                page = ctx.new_page()
                page.goto(args.url, wait_until='load')
                page.wait_for_timeout(800)  # let JS render and fonts settle
                out_dir = OUT / browser_name
                out_dir.mkdir(parents=True, exist_ok=True)
                path = out_dir / f'{label}.png'
                page.screenshot(path=str(path), full_page=False)
                print(f'  {label} ({width}×{height})')
                ctx.close()
                total += 1
            browser.close()

    print(f'\nDone — {total} screenshots in screenshots/')


if __name__ == '__main__':
    main()
