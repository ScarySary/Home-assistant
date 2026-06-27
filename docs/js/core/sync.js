export function syncConfigured(settings) {
  return Boolean(settings?.sync?.supabaseUrl?.trim() && settings?.sync?.anonKey?.trim());
}

export function cloudSignedIn(settings) {
  const auth = settings?.sync?.auth;
  return Boolean(syncConfigured(settings) && auth?.accessToken && auth?.userId);
}

export function syncStatus(settings) {
  if (!navigator.onLine) return "Offline";
  const sync = settings?.sync;
  if (!syncConfigured(settings)) return "Local only";
  return sync.status || (cloudSignedIn(settings) ? "Synced" : "Local only");
}

export function friendlySyncMessage(message = "") {
  if (!message) return "";
  if (/JWT expired|invalid jwt/i.test(message)) return "Sign in again to refresh sync.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return "Waiting for internet. Try Sync now again when online.";
  if (/before first sync|backup/i.test(message)) return "Backup needed before sync.";
  if (/Sign in with Supabase Auth/i.test(message)) return "Sign in again before syncing.";
  if (/No household membership/i.test(message)) return "This account is not connected to the household yet.";
  if (/invalid input syntax for type uuid/i.test(message)) return "Use the long household ID from Supabase, not a nickname.";
  if (/No cloud household data/i.test(message)) return "No cloud copy found yet. Sync from the main phone first.";
  return message;
}

export async function signUpSupabaseAccount(settings, email, password) {
  const sync = settings.sync;
  validateBaseSettings(sync);
  const result = await callAuth(sync, "/auth/v1/signup", {
    email: email.trim(),
    password
  });
  return authResult(result, email);
}

export async function signInSupabaseAccount(settings, email, password) {
  const sync = settings.sync;
  validateBaseSettings(sync);
  const result = await callAuth(sync, "/auth/v1/token?grant_type=password", {
    email: email.trim(),
    password
  });
  return authResult(result, email);
}

export async function createCloudHousehold(data, householdName) {
  const sync = data.settings.sync;
  validateSignedIn(sync);
  const response = await callSupabase(sync, "/rest/v1/rpc/create_household", {
    method: "POST",
    body: JSON.stringify({
      p_name: householdName || data.household.name || "Our Household"
    })
  });
  return {
    householdId: response?.household_id,
    role: response?.role || "Administrator"
  };
}

export async function loadCloudMembership(settings) {
  const sync = settings.sync;
  validateSignedIn(sync);
  const userId = encodeURIComponent(sync.auth.userId);
  const rows = await callSupabase(sync, `/rest/v1/household_members?select=household_id,role&user_id=eq.${userId}&limit=1`, {
    method: "GET"
  });
  return Array.isArray(rows) ? rows[0] : null;
}

export async function loadCloudMembers(settings) {
  const sync = settings.sync;
  validateSignedIn(sync);
  const householdId = sync.householdKey;
  if (!householdId) return [];
  const id = encodeURIComponent(householdId);
  const rows = await callSupabase(sync, `/rest/v1/household_members?select=user_id,role,created_at&household_id=eq.${id}&order=created_at.asc`, {
    method: "GET"
  });
  return Array.isArray(rows) ? rows : [];
}

export async function syncHouseholdSnapshot(data) {
  const sync = data.settings.sync;
  validateSignedIn(sync);
  const householdId = sync.householdKey || data.household.id;
  if (!householdId) throw new Error("Create or join a cloud household before syncing.");

  const cloud = await pullSnapshot(sync, householdId);
  const localPayload = preparePayload(data, householdId);
  const mergeResult = cloud?.payload
    ? mergeHouseholdData(localPayload, cloud.payload)
    : { data: localPayload, conflicts: [] };

  const newest = newestDate(localPayload.meta?.updatedAt, cloud?.payload?.meta?.updatedAt);
  const shouldPush = !cloud?.payload || newest === localPayload.meta?.updatedAt || mergeResult.conflicts.length;
  if (shouldPush) {
    await pushSnapshot(sync, householdId, mergeResult.data);
  }

  return {
    data: mergeResult.data,
    conflictWarning: mergeResult.conflicts.length
      ? `${mergeResult.conflicts.length} item conflict${mergeResult.conflicts.length === 1 ? "" : "s"} resolved. The newest edit was kept.`
      : "",
    updatedAt: new Date().toISOString()
  };
}

export async function pushHouseholdToCloud(data) {
  const result = await syncHouseholdSnapshot(data);
  return {
    message: result.conflictWarning || "Cloud household synced.",
    updatedAt: result.updatedAt,
    data: result.data,
    conflictWarning: result.conflictWarning
  };
}

export async function pullHouseholdFromCloud(settings) {
  const sync = settings.sync;
  validateSignedIn(sync);
  const householdId = sync.householdKey;
  if (!householdId) throw new Error("Create or join a cloud household before pulling.");
  const cloud = await pullSnapshot(sync, householdId);
  if (!cloud?.payload) throw new Error("No cloud household data was found yet.");
  return cloud.payload;
}

export function preparePayload(data, householdId = data.household.id) {
  return {
    ...data,
    household: {
      ...data.household,
      id: householdId
    },
    settings: {
      ...data.settings,
      sync: sanitizedSync(data.settings.sync)
    },
    meta: {
      ...data.meta,
      lastSyncedByDeviceId: data.settings.sync.deviceId || "",
      lastSyncedByDeviceName: data.settings.sync.deviceName || "This phone",
      syncedAt: new Date().toISOString()
    }
  };
}

export function sanitizedSync(sync = {}) {
  return {
    ...sync,
    syncSecret: "",
    auth: {
      userId: sync.auth?.userId || "",
      email: sync.auth?.email || "",
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
      signedInAt: sync.auth?.signedInAt || null
    }
  };
}

async function pullSnapshot(sync, householdId) {
  const id = encodeURIComponent(householdId);
  const rows = await callSupabase(sync, `/rest/v1/household_snapshots?select=payload,updated_at&household_id=eq.${id}&limit=1`, {
    method: "GET"
  });
  return Array.isArray(rows) ? rows[0] : null;
}

async function pushSnapshot(sync, householdId, payload) {
  return callSupabase(sync, "/rest/v1/household_snapshots", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      household_id: householdId,
      payload,
      updated_at: new Date().toISOString(),
      updated_by: sync.auth.userId
    })
  });
}

async function callAuth(sync, path, body) {
  const response = await fetch(`${normalizeSupabaseUrl(sync.supabaseUrl)}${path}`, {
    method: "POST",
    headers: publicHeaders(sync.anonKey),
    body: JSON.stringify(body)
  });
  return parseResponse(response, "Supabase Auth request failed.");
}

async function callSupabase(sync, path, options) {
  const headers = {
    ...publicHeaders(sync.anonKey),
    Authorization: `Bearer ${sync.auth.accessToken}`,
    ...(options.headers || {})
  };
  const response = await fetch(`${normalizeSupabaseUrl(sync.supabaseUrl)}${path}`, {
    ...options,
    headers
  });
  return parseResponse(response, "Supabase sync request failed.");
}

async function parseResponse(response, fallback) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (!response.ok) {
    throw new Error(data?.msg || data?.message || data?.error_description || data?.error || fallback);
  }
  return data;
}

function publicHeaders(key) {
  return {
    apikey: key.trim(),
    "Content-Type": "application/json"
  };
}

function authResult(result, email) {
  const user = result.user || {};
  const session = result.session || result;
  if (!session?.access_token) {
    return {
      userId: user.id || "",
      email: email.trim(),
      accessToken: "",
      refreshToken: "",
      expiresAt: 0,
      signedInAt: new Date().toISOString(),
      message: "Account created. Check your email if Supabase asks you to confirm before signing in."
    };
  }
  return {
    userId: user.id || session.user?.id || "",
    email: user.email || email.trim(),
    accessToken: session.access_token,
    refreshToken: session.refresh_token || "",
    expiresAt: session.expires_at || 0,
    signedInAt: new Date().toISOString(),
    message: "Signed in to private cloud sync."
  };
}

function validateBaseSettings(sync) {
  if (!sync?.supabaseUrl?.trim() || !sync?.anonKey?.trim()) {
    throw new Error("Add the Supabase Project URL and publishable key first.");
  }
  normalizeSupabaseUrl(sync.supabaseUrl);
}

function validateSignedIn(sync) {
  validateBaseSettings(sync);
  if (!sync.auth?.accessToken || !sync.auth?.userId) {
    throw new Error("Sign in with Supabase Auth before syncing household data.");
  }
}

function normalizeSupabaseUrl(value) {
  let url = value.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/rest\/v1.*$/i, "").replace(/\/auth\/v1.*$/i, "").replace(/\/+$/, "");

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error("Use the Supabase Project URL only, like https://your-project.supabase.co. Remove anything after .co.");
  }
  return url;
}

function mergeHouseholdData(localData, cloudData) {
  const conflicts = [];
  const merged = {
    ...cloudData,
    ...localData,
    meta: newestRecord(localData.meta, cloudData.meta),
    household: { ...cloudData.household, ...localData.household },
    settings: localData.settings,
    users: mergeByUpdatedAt(localData.users || [], cloudData.users || [], conflicts, "user"),
    modules: {
      debts: { items: mergeByUpdatedAt(localData.modules?.debts?.items || [], cloudData.modules?.debts?.items || [], conflicts, "debt").map((debt) => ({
        ...debt,
        repayments: mergeByUpdatedAt(
          localData.modules?.debts?.items?.find((item) => item.id === debt.id)?.repayments || [],
          cloudData.modules?.debts?.items?.find((item) => item.id === debt.id)?.repayments || [],
          conflicts,
          "repayment"
        )
      })) },
      savings: { goals: mergeByUpdatedAt(localData.modules?.savings?.goals || [], cloudData.modules?.savings?.goals || [], conflicts, "savings goal") },
      streaming: { items: mergeByUpdatedAt(localData.modules?.streaming?.items || [], cloudData.modules?.streaming?.items || [], conflicts, "streaming service") }
    }
  };
  merged.meta.updatedAt = newestDate(localData.meta?.updatedAt, cloudData.meta?.updatedAt) || new Date().toISOString();
  return { data: merged, conflicts };
}

function mergeByUpdatedAt(localItems, cloudItems, conflicts, label) {
  const byId = new Map();
  [...cloudItems, ...localItems].forEach((item) => {
    if (!item?.id) return;
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      return;
    }
    if (JSON.stringify(stripNested(existing)) !== JSON.stringify(stripNested(item))) {
      conflicts.push({ label, id: item.id });
    }
    byId.set(item.id, newestRecord(item, existing));
  });
  return Array.from(byId.values());
}

function newestRecord(a = {}, b = {}) {
  return newestDate(a.updatedAt, b.updatedAt) === b.updatedAt ? b : a;
}

function newestDate(a, b) {
  if (!a) return b || "";
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function stripNested(item) {
  const copy = { ...item };
  delete copy.repayments;
  return copy;
}
