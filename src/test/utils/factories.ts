export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  avatar?: string;
  subscriptionPlan?: "free" | "basic" | "premium" | "pro";
  phone?: string;
  location?: string;
  targetScore?: number;
  examDate?: string;
  bio?: string;
  country?: string;
  state?: string;
  city?: string;
  plan?: string;
}

export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: "user-1",
    name: "Test Student",
    email: "student@test.com",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    subscriptionPlan: "free",
    phone: "",
    location: "",
    targetScore: 79,
    examDate: "",
    bio: "",
    country: "",
    state: "",
    city: "",
    plan: "Free",
    ...overrides,
  };
}

export function makeAdmin(overrides: Partial<TestUser> = {}): TestUser {
  return makeUser({
    id: "admin-1",
    name: "Test Admin",
    email: "admin@test.com",
    role: "admin",
    ...overrides,
  });
}

interface FetchResponseSpec {
  ok?: boolean;
  status?: number;
  json?: any;
}

export function makeFetchResponse(spec: FetchResponseSpec) {
  const ok = spec.ok ?? (spec.status ? spec.status >= 200 && spec.status < 300 : true);
  return {
    ok,
    status: spec.status ?? (ok ? 200 : 400),
    json: async () => spec.json ?? {},
  };
}
