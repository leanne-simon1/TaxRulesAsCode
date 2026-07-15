# Standalone image for self-hosting (no Lagoon/pygmy/base-image dependency).
# Serves the OpenFisca web API for the openfisca_rules package on port 5000.
FROM python:3.11-slim

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY openfisca_rules ./openfisca_rules
RUN pip install .

EXPOSE 5000

CMD ["openfisca", "serve", "--country-package", "openfisca_rules", "--bind", "0.0.0.0:5000", "--workers", "3"]
