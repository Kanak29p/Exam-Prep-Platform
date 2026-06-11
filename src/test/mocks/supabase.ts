import { vi } from "vitest";

export const uploadMock = vi
  .fn()
  .mockResolvedValue({ data: { path: "ok" }, error: null });

export const getPublicUrlMock = vi.fn(() => ({
  data: { publicUrl: "https://example.com/audio.mp3" },
}));

export const supabaseMock = {
  storage: {
    from: vi.fn(() => ({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    })),
  },
};

export function resetSupabaseMocks() {
  uploadMock.mockReset().mockResolvedValue({ data: { path: "ok" }, error: null });
  getPublicUrlMock.mockReset().mockReturnValue({
    data: { publicUrl: "https://example.com/audio.mp3" },
  });
  (supabaseMock.storage.from as any).mockClear();
}
