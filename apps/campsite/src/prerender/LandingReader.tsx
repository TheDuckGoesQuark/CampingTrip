import { blogPaths } from "../routing/blogPaths";

const CREDITS: { name: string; href?: string; by?: string }[] = [
  {
    name: "Stylized Campfire",
    href: "https://sketchfab.com/3d-models/stylized-campfire-3b507b1eb4c142218a4b3baa043e3ed4",
    by: "Natalia Campos",
  },
  {
    name: "Cosy Picnic Area",
    href: "https://sketchfab.com/3d-models/cosy-picnic-area-0a1fc21d723e454b91314809871e1031",
  },
  {
    name: "Laptop",
    href: "https://sketchfab.com/3d-models/laptop-7d870e900889481395b4a575b9fa8c3e",
  },
  {
    name: "Shure SM57 Microphone",
    href: "https://sketchfab.com/3d-models/shure-sm57-dynamic-microphone-ec2dc94e022547beadee622b1ff34a5d",
  },
  {
    name: "Moka Pot",
    href: "https://sketchfab.com/3d-models/moka-pot-2ca52d750d95471a953fb2c9eb577da6",
  },
  {
    name: "Notepad",
    href: "https://sketchfab.com/3d-models/notepadb-0b30d2efe63f41b0a812904b610fe577",
  },
  {
    name: "Focusrite Scarlett Solo",
    href: "https://sketchfab.com/3d-models/focusrite-scarlett-solo-interface-f09111be4a5c48228c3b898965d62bba",
  },
  {
    name: "Akai MPK Mini Controller",
    href: "https://sketchfab.com/3d-models/akai-mpk-mini-midi-controller-89eae01d0547430bb8e10110eaadaa81",
  },
  { name: "Acoustic Guitar", by: "CC-BY via Sketchfab" },
  { name: "Cat Walk animation", by: "CC-BY via Sketchfab" },
];

export default function LandingReader() {
  return (
    <div className="blog-prose">
      <h1>Jordan's Campsite</h1>
      <p>
        A cosy 3D camping scene built with React Three Fiber. Sit inside a tent on a rainy night:
        there's a lantern overhead, a cat strolling past, a campfire crackling outside, and a laptop
        with my projects. Enable JavaScript to experience the full interactive scene.
      </p>

      <h3>About</h3>
      <p>
        Hi, I'm Jordan Mackie. This is my personal website, a geocities-style art experiment
        disguised as a camping trip. The scene has a day/night cycle, spatial audio, and a few
        things to click on.
      </p>

      <h3>Read</h3>
      <ul>
        <li>
          <a href={blogPaths.home}>The laptop: who I am, what I've built, what I use</a>
        </li>
        <li>
          <a href={blogPaths.archive}>All blog posts</a>
        </li>
        <li>
          <a href="https://github.com/TheDuckGoesQuark">GitHub</a>
        </li>
      </ul>

      <h3>What's in the tent</h3>
      <ul>
        <li>A laptop with my projects</li>
        <li>An acoustic guitar</li>
        <li>A moka pot for coffee</li>
        <li>A notepad</li>
        <li>A midi controller and audio interface for making music</li>
        <li>A lantern you can toggle on and off</li>
        <li>A cat named Smittens who wanders past</li>
        <li>A campfire and picnic area outside</li>
      </ul>

      <h3>3D model credits</h3>
      <p>All models used under CC-BY licenses:</p>
      <ul>
        {CREDITS.map((credit) => (
          <li key={credit.name}>
            {credit.href ? <a href={credit.href}>{credit.name}</a> : credit.name}
            {credit.by ? ` (${credit.by})` : null}
          </li>
        ))}
      </ul>
      <p>
        Source code: <a href="https://github.com/TheDuckGoesQuark/CampingTrip">MIT License</a>.
        Design &amp; assets:{" "}
        <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/">CC BY-NC-ND 4.0</a>.
      </p>
    </div>
  );
}
