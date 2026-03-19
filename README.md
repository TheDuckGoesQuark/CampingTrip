# Jordan's Camp

A personal platform hosted at **[jordanscamp.site](https://jordanscamp.site)**, structured as a pnpm monorepo with multiple frontend apps and a shared Django backend.

## Apps

| App | URL | Description | Docs |
|-----|-----|-------------|------|
| **Campsite** | [jordanscamp.site](https://jordanscamp.site) | Interactive 3D camping scene — the homepage | [apps/campsite/README.md](apps/campsite/README.md) |
| **Workout** | [workout.jordanscamp.site](https://workout.jordanscamp.site) | Workout tracker PWA with offline support | [apps/workout/README.md](apps/workout/README.md) |
| **Digital Twins** | [digitaltwins.jordanscamp.site](https://digitaltwins.jordanscamp.site) | Scrollytelling blog with interactive cause-and-effect visualizations | — |
| **Backend** | [api.jordanscamp.site](https://api.jordanscamp.site) | Django REST API shared by all apps | [backend/README.md](backend/README.md) |

See [docs/architecture.md](docs/architecture.md) for how everything fits together.

## Getting started

```bash
pnpm install               # install all workspace dependencies
pnpm --filter campsite dev      # run campsite locally
pnpm --filter workout dev       # run workout locally
pnpm --filter digitaltwins dev  # run digital twins locally
```

```bash
cd backend
docker compose up     # run backend + postgres locally
```

## Workspace commands

```bash
pnpm -r build         # build all frontend apps
pnpm -r test          # run all frontend tests
pnpm -r exec tsc -b   # typecheck all apps
```

## Tech stack

- **Frontend**: React + TypeScript + Vite, managed as a pnpm workspace
- **Backend**: Django 5 + Django REST Framework, with Poetry for dependency management
- **Infrastructure**: Terraform on AWS (EC2, RDS, S3, ECR, Route53)
- **CI/CD**: GitHub Actions — lint, test, build, deploy on push to main

## License

The source code is licensed under the [MIT License](LICENSE).

The design, visual assets, and written content are licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

## 3D model credits

All models are used under CC-BY licenses. Attribution is required — please keep these credits intact.

| Model | Source |
|---|---|
| Stylized Campfire | [Natalia Campos on Sketchfab](https://sketchfab.com/3d-models/stylized-campfire-3b507b1eb4c142218a4b3baa043e3ed4) |
| Cosy Picnic Area | [Sketchfab](https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031) |
| Laptop | [Sketchfab](https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e) |
| Acoustic Guitar | [Sketchfab](https://sketchfab.com/tags/low-poly-guitar) |
| Cat Walk | [Sketchfab](https://sketchfab.com/tags/cat-walk) |
| Shure SM57 Microphone | [Sketchfab](https://sketchfab.com/3d-models/shure-sm57-dynamic-microphone-ec2dc94e022547beadee622b1ff34a5d) |
| Moka Pot | [Sketchfab](https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6) |
| Notepad | [Sketchfab](https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577) |
| Focusrite Scarlett Solo | [Sketchfab](https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba) |
| Akai MPK Mini Controller | [Sketchfab](https://sketchfab.com/3d-models/akai-mpk-mini-midi-controller-89eae01d0547430bb8e10110eaadaa81) |
