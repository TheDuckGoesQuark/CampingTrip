import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mailPreset } from "../../../data/mailPresets";
import type { Feedback } from "./submitFeedback";
import { useCompose } from "./useCompose";

/** The body the endpoint would have received. */
function sentBody(): Feedback {
  const [, init] = vi.mocked(fetch).mock.calls[0];
  return JSON.parse(init?.body as string);
}

describe("useCompose", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("templates", () => {
    it("fills in the subject and the message together", () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.choosePreset("bug"));
      expect(result.current.preset).toBe("bug");
      expect(result.current.subject).toBe(mailPreset("bug").subject);
      expect(result.current.message).toBe(mailPreset("bug").body);
    });

    it("opens on the template the visitor asked for on their way in", () => {
      const { result } = renderHook(() => useCompose("work"));
      expect(result.current.preset).toBe("work");
      expect(result.current.subject).toBe(mailPreset("work").subject);
    });

    it("rewrites a previous template, which nobody typed", () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.choosePreset("bug"));
      act(() => result.current.choosePreset("feedback"));
      expect(result.current.subject).toBe(mailPreset("feedback").subject);
      expect(result.current.message).toBe(mailPreset("feedback").body);
    });

    // The rule worth protecting: a curious click must never cost a sentence.
    it("leaves what the visitor typed alone", () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("I wrote this myself"));
      act(() => result.current.choosePreset("bug"));
      expect(result.current.message).toBe("I wrote this myself");
      // The field they left alone still fills in.
      expect(result.current.subject).toBe(mailPreset("bug").subject);
    });

    it("fills a field again once the visitor has emptied it", () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setSubject("mine"));
      act(() => result.current.setSubject("   "));
      act(() => result.current.choosePreset("bug"));
      expect(result.current.subject).toBe(mailPreset("bug").subject);
    });

    it("clears the others when the free-form choice is taken", () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.choosePreset("bug"));
      act(() => result.current.choosePreset("other"));
      expect(result.current.preset).toBe("other");
      expect(result.current.subject).toBe("");
      expect(result.current.message).toBe("");
    });
  });

  describe("sending", () => {
    it("refuses an empty note without troubling the endpoint", async () => {
      const { result } = renderHook(() => useCompose());
      await act(async () => result.current.send());
      expect(result.current.messageError).toMatch(/add a note first/i);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("clears that complaint once something is typed, and sends", async () => {
      const { result } = renderHook(() => useCompose());
      await act(async () => result.current.send());
      act(() => result.current.setMessage("the cat is great"));
      await act(async () => result.current.send());
      await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
      expect(result.current.messageError).toBeUndefined();
      expect(sentBody().message).toBe("the cat is great");
    });

    it("posts to the same-origin path, so there is no preflight", async () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("hello"));
      await act(async () => result.current.send());
      expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/contact");
    });

    it("carries the subject line, trimmed", async () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("hi"));
      act(() => result.current.setSubject("  a broken thing  "));
      await act(async () => result.current.send());
      expect(sentBody().subject).toBe("a broken thing");
    });

    it("omits the subject and the email entirely when neither is given", async () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("no reply needed"));
      await act(async () => result.current.send());
      const body = sentBody();
      expect("subject" in body).toBe(false);
      expect("email" in body).toBe(false);
    });

    it("carries the email when one is given, trimmed", async () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("  do reply  "));
      act(() => result.current.setEmail("  a@b.com  "));
      await act(async () => result.current.send());
      const body = sentBody();
      expect(body.email).toBe("a@b.com");
      expect(body.message).toBe("do reply");
    });

    it("sends the empty honeypot and a mount time for the dwell check", async () => {
      const before = Date.now();
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("hi"));
      await act(async () => result.current.send());
      const body = sentBody();
      expect(body.trap).toBe("");
      expect(body.mountedAt).toBeGreaterThanOrEqual(before);
      expect(body.mountedAt).toBeLessThanOrEqual(Date.now());
    });

    it("reaches `sent` when the endpoint takes it", async () => {
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("smiled"));
      await act(async () => result.current.send());
      await waitFor(() => expect(result.current.phase).toBe("sent"));
    });

    it("reaches `failed` when the endpoint refuses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(null, { status: 400 })),
      );
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("smiled"));
      await act(async () => result.current.send());
      await waitFor(() => expect(result.current.phase).toBe("failed"));
    });

    it("reaches `failed` when the network never answers", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("offline");
        }),
      );
      const { result } = renderHook(() => useCompose());
      act(() => result.current.setMessage("smiled"));
      await act(async () => result.current.send());
      await waitFor(() => expect(result.current.phase).toBe("failed"));
    });
  });
});
