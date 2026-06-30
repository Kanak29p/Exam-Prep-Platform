import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const mocks = vi.hoisted(() => {
  const uploadMock = vi.fn();
  const getPublicUrlMock = vi.fn();
  const fetchMock = vi.fn();
  class MockSpeechRecognition {
    continuous = false;
    interimResults = false;
    lang = "";
    onresult: any = null;
    onerror: any = null;
    start = vi.fn();
    stop = vi.fn();
    static instances: MockSpeechRecognition[] = [];
    constructor() {
      MockSpeechRecognition.instances.push(this);
    }
  }
  (globalThis as any).SpeechRecognition = MockSpeechRecognition;
  (globalThis as any).webkitSpeechRecognition = MockSpeechRecognition;
  (globalThis as any).fetch = fetchMock;
  return { uploadMock, getPublicUrlMock, fetchMock, MockSpeechRecognition };
});

vi.mock("../../../lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mocks.uploadMock,
        getPublicUrl: mocks.getPublicUrlMock,
      }),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { AudioRecorder } from "../AudioRecorder";

class FakeMediaRecorder {
  state = "inactive";
  ondataavailable: any = null;
  onstop: any = null;
  static instances: FakeMediaRecorder[] = [];
  constructor(_stream: any) {
    FakeMediaRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(["x"], { type: "audio/webm" }) });
    }
    if (this.onstop) this.onstop();
  }
}

beforeEach(() => {
  mocks.uploadMock.mockReset();
  mocks.getPublicUrlMock.mockReset();
  mocks.fetchMock.mockReset();
  FakeMediaRecorder.instances = [];
  mocks.MockSpeechRecognition.instances = [];
  (globalThis as any).MediaRecorder = FakeMediaRecorder as any;
  (globalThis as any).URL.createObjectURL = vi.fn(() => "blob:fake-url");
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AudioRecorder", () => {
  it("toasts error if microphone access fails", async () => {
    const { toast } = await import("sonner");
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    const errSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(<AudioRecorder />);
    fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to access microphone. Please check permissions.",
      ),
    );
    errSpy.mockRestore();
  });

  it("starts recording and triggers onRecordingStart", async () => {
    const onStart = vi.fn();
    render(<AudioRecorder onRecordingStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));

    await waitFor(() => expect(onStart).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: /Stop Recording/i }),
    ).toBeInTheDocument();
  });

  it("uploads to backend and triggers onUploadSuccess", async () => {
    const { toast } = await import("sonner");
    mocks.fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: "https://example.com/audio.mp3" }),
    });
    const onUpload = vi.fn();

    render(<AudioRecorder onUploadSuccess={onUpload} />);
    fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Stop Recording/i }),
      ).toBeInTheDocument(),
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Submit Answer/i }),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Answer submitted successfully!",
      ),
    );
    expect(onUpload).toHaveBeenCalledWith(
      "https://example.com/audio.mp3",
      "",
    );
  });

  it("toasts error when backend upload fails", async () => {
    const { toast } = await import("sonner");
    mocks.fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Upload failed" }),
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<AudioRecorder />);
    fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Stop Recording/i }),
      ).toBeInTheDocument(),
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Submit Answer/i }),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /Submit Answer/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Upload failed"),
    );
    errSpy.mockRestore();
  });

  it("auto-starts recording when autoStartRecording is true", async () => {
    const onStart = vi.fn();
    render(
      <AudioRecorder autoStartRecording={true} onRecordingStart={onStart} />,
    );
    await waitFor(() => expect(onStart).toHaveBeenCalled());
  });

  it("uses SpeechRecognition to update transcript when speaking", async () => {
    render(<AudioRecorder />);
    fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));

    await waitFor(() => {
      expect(mocks.MockSpeechRecognition.instances.length).toBe(1);
    });

    const recognition = mocks.MockSpeechRecognition.instances[0];
    expect(recognition.start).toHaveBeenCalled();

    act(() => {
      recognition.onresult({
        results: [
          [
            { transcript: "Hello from speech recognition" }
          ]
        ]
      });
    });

    expect(screen.getByText("Hello from speech recognition")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    expect(recognition.stop).toHaveBeenCalled();
  });

  it("handles SpeechRecognition errors gracefully", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<AudioRecorder />);
    fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));

    await waitFor(() => {
      expect(mocks.MockSpeechRecognition.instances.length).toBe(1);
    });

    const recognition = mocks.MockSpeechRecognition.instances[0];
    
    act(() => {
      recognition.onerror(new Error("speech recognition failed"));
    });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("auto-stops recording when elapsed time reaches maxTimeSeconds", async () => {
    vi.useFakeTimers();
    render(<AudioRecorder maxTimeSeconds={5} />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
      await vi.advanceTimersByTimeAsync(10);
    });

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(screen.getByText("Recording complete")).toBeInTheDocument();
  });
});
