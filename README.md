# Jordan's Camp

A personal platform hosted at **[jordanscamp.site](https://jordanscamp.site)**, structured as a pnpm monorepo of static frontend apps. There is currently no backend — the apps are static SPAs served by Caddy on a single EC2 instance. See [Adding a backend later](#adding-a-backend-later) for the on-ramp when one is needed.

## Apps

| App            | URL                                                                          | Description                                                                                                     | Docs                                                               |
| -------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Campsite**   | [jordanscamp.site](https://jordanscamp.site)                                 | Interactive 3D camping scene — the homepage, with the laptop opening a `/blog`                                  | [apps/campsite/README.md](apps/campsite/README.md)                 |
| **PhotoBroom** | [jordanscamp.site/blog/photobroom](https://jordanscamp.site/blog/photobroom) | Chrome extension for sweeping Google Photos search results into the bin; its landing lives in the campsite blog | [extensions/photobroom/README.md](extensions/photobroom/README.md) |

PhotoBroom is a Chrome extension in `extensions/photobroom` that injects an
in-page overlay onto `photos.google.com`. `apps/photobroom` is now just that
overlay's source + build (`pnpm --filter photobroom build:overlay` emits
`extensions/photobroom/overlay.js`); its landing/marketing page lives in the
campsite blog at `/blog/photobroom`. See its
[README](extensions/photobroom/README.md).

See [docs/architecture.md](docs/architecture.md) for how everything fits together.

## Getting started

```bash
pnpm install                    # install all workspace dependencies
pnpm --filter campsite dev            # run campsite locally
pnpm --filter photobroom build:overlay  # build the PhotoBroom extension bundle
pnpm --filter campsite models:optimise  # recompress public/models after adding one
```

## Workspace commands

```bash
pnpm -r build         # build all frontend apps
pnpm -r test          # run all frontend tests
pnpm -r exec tsc -b   # typecheck all apps
```

## Tech stack

- **Frontend**: React + TypeScript + Vite, managed as a pnpm workspace
- **3D assets**: GLB with WebP textures and Draco-compressed geometry; the
  decoder is served from `apps/campsite/public/draco`. A newly added model is
  put through `pnpm --filter campsite models:optimise` before it is committed.
- **Hosting**: Caddy (auto-TLS static file server) on a single EC2 instance
- **Infrastructure**: Terraform on AWS (EC2, S3, Route53)
- **CI/CD**: GitHub Actions — lint, test, build, deploy on push to main

## Adding a backend later

The apps are static today, but the box is kept backend-ready (Docker + Compose are
installed by the EC2 bootstrap). To add a DB-backed backend in any language:

1. Write a `docker-compose.yml` in `/opt/jordanscamp` with your service container and a
   co-located `postgres` container using a named volume. A co-located Postgres costs nothing
   extra — it shares the EC2 you already pay for, so there's no always-on database bill.
2. Add a `reverse_proxy` block for an `api` subdomain to `infra/Caddyfile` (and the EC2
   bootstrap Caddyfile in `infra/templates/user_data.sh`).
3. Add a Route53 A record for the `api` subdomain in `infra/route53.tf` pointing to the EIP.
4. Wire build/deploy into `.github/workflows/deploy.yml`.

## License

The source code is licensed under the [MIT License](LICENSE).

The design, visual assets, and written content are licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

## 3D model credits

All models are used under CC-BY licenses. Attribution is required — please keep these credits intact.

| Model                    | Source                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Stylized Campfire        | [Natalia Campos on Sketchfab](https://sketchfab.com/3d-models/stylized-campfire-3b507b1eb4c142218a4b3baa043e3ed4) |
| Cosy Picnic Area         | [Sketchfab](https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031)                    |
| Laptop                   | [Sketchfab](https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e)                              |
| Acoustic Guitar          | [Sketchfab](https://sketchfab.com/tags/low-poly-guitar)                                                           |
| Cat Walk                 | [Sketchfab](https://sketchfab.com/tags/cat-walk)                                                                  |
| Shure SM57 Microphone    | [Sketchfab](https://sketchfab.com/3d-models/shure-sm57-dynamic-microphone-ec2dc94e022547beadee622b1ff34a5d)       |
| Moka Pot                 | [Sketchfab](https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6)                            |
| Notepad                  | [Sketchfab](https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577)                            |
| Focusrite Scarlett Solo  | [Sketchfab](https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba)   |
| Akai MPK Mini Controller | [Sketchfab](https://sketchfab.com/3d-models/akai-mpk-mini-midi-controller-89eae01d0547430bb8e10110eaadaa81)       |
