PYTHON = .venv/bin/python3

.PHONY: serve install install-dev screenshots images audio icons

.venv:
	python3 -m venv .venv

install: .venv
	$(PYTHON) -m pip install -r requirements.txt

install-dev: install
	$(PYTHON) -m pip install -r requirements-dev.txt
	$(PYTHON) -m playwright install chromium webkit

serve:
	python3 -m http.server 8080

screenshots:
	$(PYTHON) scripts/screenshot_devices.py

images:
	$(PYTHON) scripts/generate_images.py

audio:
	$(PYTHON) scripts/generate_audio.py

icons:
	$(PYTHON) scripts/generate_icons.py
