# TODO

## Tent open/close mechanic
- [ ] Add tent flap open/close interaction (click or swipe to unzip/zip)
- [ ] Different ambient environment when tent is open vs closed
  - Open: brighter interior, outdoor sounds more prominent, wider camera range
  - Closed: cosier, muffled rain, warmer lighting
- [ ] Animate tent flap mesh (morph target or bone-based)
- [ ] Deferred loading of outdoor models — PicnicArea, Campfire, WalkingCat GLBs
      don't need to load until the tent is first opened. Load them lazily on first
      open (R3F Suspense boundary around outdoor group) so initial tent load is faster.
      OutdoorScene (sky/stars/clouds) is procedural so it's cheap either way.

## Ideas / backlog
- [ ] Sound changes when tent opens (rain gets louder, campfire crackle fades in)
- [ ] Visual transition effect when opening tent (light spill, blur fade)
