# Minimal image for development only
FROM node:slim@sha256:193fe51b64e77981119c98c2002c9e32a70e2f006fb4d25068ce0558998917f0 AS dev
WORKDIR /repo/apps/ui

# Nothing is copied; the compose bind-mount supplies code and tsconfig.
# Exposes on 0.0.0.0:5173
CMD ["npm", "run", "dev", "--", "--host"]
