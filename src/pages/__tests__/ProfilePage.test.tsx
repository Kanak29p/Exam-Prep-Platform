import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockSetUser = vi.fn();
const mockUser = {
  id: "u1",
  name: "Profile User",
  email: "p@test.com",
  role: "student" as const,
  phone: "",
  country: "",
  state: "",
  city: "",
  targetScore: 79,
  examDate: "",
  bio: "",
  avatar: "",
  plan: "Free",
};

let activeUser = { ...mockUser };

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: activeUser, setUser: mockSetUser }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { ProfilePage } from "../ProfilePage";

function renderProfile() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

const getSelectByPlaceholder = (container: HTMLElement, text: string) => {
  const selects = container.querySelectorAll("select");
  for (const select of selects) {
    if (select.textContent?.includes(text)) {
      return select;
    }
  }
  return null;
};

beforeEach(() => {
  activeUser = { ...mockUser };
  localStorage.setItem("token", "tok");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { ...mockUser, name: "Updated" } }),
    }),
  );
});

describe("ProfilePage", () => {
  it("renders the user's name and email from useAuth", () => {
    renderProfile();
    expect(screen.getAllByText(/Profile User/).length).toBeGreaterThan(0);
    const emailInput = screen.getByDisplayValue("p@test.com");
    expect(emailInput).toBeDisabled();
  });

  it("toggles edit mode when Edit Profile is clicked", () => {
    renderProfile();
    const editBtn = screen.getByRole("button", { name: /edit profile/i });
    fireEvent.click(editBtn);
    expect(
      screen.getAllByRole("button", { name: /cancel/i }).length,
    ).toBeGreaterThan(0);
  });

  it("switches to Settings tab", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));
    expect(screen.getAllByText(/notification|preferences/i).length).toBeGreaterThan(
      0,
    );
  });

  it("switches to Subscription tab", () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /subscription/i }));
    expect(
      screen.getAllByText(/Free|Plan/i).length,
    ).toBeGreaterThan(0);
  });

  it("calls API and toasts success on save", async () => {
    const { toast } = await import("sonner");
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));

    const nameInput = screen.getByDisplayValue("Profile User");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    const saveBtn = screen.getByRole("button", { name: /^save changes$/i });
    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Profile updated successfully!",
      ),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/profile"),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("toasts error when save API rejects", async () => {
    const { toast } = await import("sonner");
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad request" }),
    });
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));
    fireEvent.click(screen.getByRole("button", { name: /^save changes$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("Bad request");
    errorSpy.mockRestore();
  });

  it("auto-detects location via ipapi on mount if country is empty", async () => {
    const { toast } = await import("sonner");
    activeUser.country = "";

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        country_code: "IN",
        region: "Maharashtra",
        city: "Mumbai",
      }),
    });

    renderProfile();

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        expect.stringContaining("Auto-detected location"),
      ),
    );
  });

  it("updates states and cities when country and state change", async () => {
    const { container } = renderProfile();
    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));

    const countrySelect = getSelectByPlaceholder(container, "Select Country");
    expect(countrySelect).toBeInTheDocument();
    fireEvent.change(countrySelect!, { target: { value: "IN" } });

    const stateSelect = getSelectByPlaceholder(container, "Select State");
    expect(stateSelect).toBeInTheDocument();
    expect(stateSelect).not.toBeDisabled();

    fireEvent.change(stateSelect!, { target: { value: "Maharashtra" } });

    const citySelect = getSelectByPlaceholder(container, "Select City");
    expect(citySelect).toBeInTheDocument();
    expect(citySelect).not.toBeDisabled();

    fireEvent.change(citySelect!, { target: { value: "Mumbai" } });
  });

  it("generates a random avatar when edit avatar is clicked", async () => {
    const { toast } = await import("sonner");
    const { container } = renderProfile();

    const avatarBtn = container.querySelector("button.absolute.bottom-0.right-0");
    expect(avatarBtn).toBeInTheDocument();
    fireEvent.click(avatarBtn!);

    expect(toast.success).toHaveBeenCalledWith(
      "Generated a new random avatar. Save changes to keep it!",
    );
  });

  it("validates phone number digits according to country limits on save", async () => {
    const { toast } = await import("sonner");
    const { container } = renderProfile();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));

    const countrySelect = getSelectByPlaceholder(container, "Select Country");
    fireEvent.change(countrySelect!, { target: { value: "IN" } }); // India, limit 10

    const phoneInput = screen.getByPlaceholderText(/Enter 10-digit number/i);
    fireEvent.change(phoneInput, { target: { value: "12345" } });

    fireEvent.click(screen.getByRole("button", { name: /^save changes$/i }));
    expect(toast.error).toHaveBeenCalledWith(
      "Phone number must be exactly 10 digits for India.",
    );

    // Valid number
    fireEvent.change(phoneInput, { target: { value: "1234567890" } });

    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: { ...mockUser } }),
    });

    fireEvent.click(screen.getByRole("button", { name: /^save changes$/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully!"),
    );
  });

  it("toggles checkboxes in Settings tab and triggers Change Password click", () => {
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
    fireEvent.click(checkboxes[0]);

    const changePasswordBtn = screen.getByRole("button", {
      name: /change password/i,
    });
    fireEvent.click(changePasswordBtn);
  });

  it("renders subscription pricing options and payment history", () => {
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: /subscription/i }));

    expect(screen.getByText("Payment History")).toBeInTheDocument();
    expect(screen.getByText("₹1,999")).toBeInTheDocument();
  });

  it("populates profile data correctly on load when user has existing country, state, city, and phone", () => {
    activeUser = {
      ...mockUser,
      country: "IN",
      state: "Maharashtra",
      city: "Mumbai",
      phone: "+911234567890",
    };

    renderProfile();
    expect(screen.getByDisplayValue("1234567890")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+91")).toBeInTheDocument();
  });

  it("validates phone number length when country is not in lengths map", async () => {
    const { toast } = await import("sonner");
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));

    // Reset dialCode and phone
    const dialCodeInput = screen.getByPlaceholderText("+1");
    const phoneInput = screen.getByPlaceholderText(/Select country first/i);

    fireEvent.change(dialCodeInput, { target: { value: "+999" } });
    fireEvent.change(phoneInput, { target: { value: "123" } }); // too short

    fireEvent.click(screen.getByRole("button", { name: /^save changes$/i }));
    expect(toast.error).toHaveBeenCalledWith(
      "Phone number must be between 7 and 15 digits.",
    );
  });
});
