import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "@/lib/hooks/useAutosave";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

describe("useAutosave", () => {
  it("does not save the initial value", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutosave({ data: { title: "a" }, onSave }));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("debounces edits into a single save of the latest value", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ data }) => useAutosave({ data, onSave, debounceMs: 500 }),
      { initialProps: { data: { title: "a" } } }
    );

    rerender({ data: { title: "ab" } });
    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender({ data: { title: "abc" } });
    expect(result.current.status).toBe("pending");
    await act(() => vi.advanceTimersByTimeAsync(500));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: "abc" });
    expect(result.current.status).toBe("saved");
  });

  it("saves an edit made while a save is in flight (no stale closure)", async () => {
    const first = deferred();
    const onSave = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);

    const { rerender, result } = renderHook(
      ({ data }) => useAutosave({ data, onSave, debounceMs: 100 }),
      { initialProps: { data: { title: "a" } } }
    );

    rerender({ data: { title: "b" } });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(onSave).toHaveBeenLastCalledWith({ title: "b" });

    // Edit while the first save is still running.
    rerender({ data: { title: "c" } });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      first.resolve();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ title: "c" });
    expect(result.current.status).toBe("saved");
  });

  it("works with an inline (unmemoised) shouldSkip", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data }) =>
        useAutosave({
          data,
          onSave,
          debounceMs: 100,
          shouldSkip: (d) => d.title.trim() === "",
        }),
      { initialProps: { data: { title: "a" } } }
    );

    rerender({ data: { title: " " } });
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(onSave).not.toHaveBeenCalled();

    rerender({ data: { title: "ok" } });
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(onSave).toHaveBeenCalledWith({ title: "ok" });
  });

  it("treats a new server baseline as already saved", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ data, baseline }) =>
        useAutosave({ data, baseline, onSave, debounceMs: 100 }),
      { initialProps: { data: { title: "" }, baseline: { title: "" } } }
    );

    rerender({ data: { title: "loaded" }, baseline: { title: "loaded" } });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("reports errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onSave = vi.fn().mockRejectedValue(new Error("boom"));
    const { rerender, result } = renderHook(
      ({ data }) => useAutosave({ data, onSave, debounceMs: 100 }),
      { initialProps: { data: { title: "a" } } }
    );
    rerender({ data: { title: "b" } });
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(result.current.status).toBe("error");
  });
});
