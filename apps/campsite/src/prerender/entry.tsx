import { BrandProvider } from "@jordanscamp/ds";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom";

import BlogPageView from "../components/blog/BlogPageView";
import { CONTACT_HEADING } from "../components/blog/ContactFooter";
import { isBrowserPage, metaOfBlogPage, resolveBlogPage } from "../data/blogPages";
import { cv } from "../data/cv";
import { published } from "../data/posts";
import { slugify } from "../data/slug";
import { blogPaths, parseBlogPath } from "../routing/blogPaths";
import { blogUrls } from "../routing/blogUrls";
import { FEED_PATH, headTags, ORIGIN } from "./head";
import LandingReader from "./LandingReader";
import { RenderTargetContext } from "./renderTarget";

import "../styles/blogProse.css";

export { blogUrls, CONTACT_HEADING, cv, FEED_PATH, ORIGIN };
export const CV_PATH = blogPaths.cv;
export const CV_PDF_PATH = blogPaths.cvPdf;

export interface RenderedPage {
  head: string;
  html: string;
}

function toStatic(path: string, children: ReactNode): string {
  return renderToStaticMarkup(
    <RenderTargetContext.Provider value="static">
      <StaticRouter location={path}>
        <BrandProvider>
          <main id="reader">{children}</main>
        </BrandProvider>
      </StaticRouter>
    </RenderTargetContext.Provider>,
  );
}

export function render(path: string): RenderedPage | null {
  const ref = parseBlogPath(path);
  const page = ref && resolveBlogPage(ref);
  if (!page || !isBrowserPage(page)) return null;
  return {
    head: headTags(metaOfBlogPage(page), path),
    html: toStatic(path, <BlogPageView page={page} />),
  };
}

export function renderLanding(): RenderedPage {
  const meta = {
    title: "Jordan's Campsite",
    description:
      "A cosy 3D camping scene: sit inside a tent on a rainy night with a crackling campfire, a wandering cat, and a lantern overhead. Personal website of Jordan Mackie.",
    kind: "website" as const,
  };
  return { head: headTags(meta, "/"), html: toStatic("/", <LandingReader />) };
}

export interface FeedEntry {
  title: string;
  path: string;
  date: string;
  summary: string;
  html: string;
}

export function feedEntries(): FeedEntry[] {
  return published.map((post) => ({
    title: post.title,
    path: blogPaths.post(slugify(post.title)),
    date: post.date,
    summary: post.standfirst,
    html: renderToStaticMarkup(
      <RenderTargetContext.Provider value="static">
        <StaticRouter location={blogPaths.post(slugify(post.title))}>{post.body}</StaticRouter>
      </RenderTargetContext.Provider>,
    ),
  }));
}
