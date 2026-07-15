ARG IMAGE_VERSION=latest
FROM ghcr.io/salsadigitalauorg/salsa-images/rules-as-code:${IMAGE_VERSION}

# Set the repository URL
ARG LAGOON_PROJECT
ENV REPOSITORY_URL=https://github.com/salsadigitalauorg/${LAGOON_PROJECT}
RUN echo "REPOSITORY_URL: $REPOSITORY_URL"
RUN sed -i.template "s|https://github.com/openfisca/country-template|$REPOSITORY_URL|g" /app/openfisca-rules/pyproject.toml

# Add dependencies for API Testing
RUN apk add curl jq

# Remove the default existing rules
RUN rm -rf /app/openfisca-rules/openfisca_rules/*
# Copy the new project rules
COPY openfisca_rules /app/openfisca-rules/openfisca_rules
