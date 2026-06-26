export function syncConfigured(settings) {
  return Boolean(
    settings?.sync?.supabaseUrl?.trim()
    && settings?.sync?.anonKey?.trim()
    && settings?.sync?.householdKey?.trim()
    && settings?.sync?.syncSecret?.trim()
  );
}

export async function pushHouseholdToCloud(data) {
  const sync = data.settings.sync;
  validateSyncSettings(sync);
  const payload = preparePayload(data);
  const response = await callSupabaseRpc(sync, "push_household", {
    p_household_key: sync.householdKey.trim(),
    p_sync_secret: sync.syncSecret,
    p_payload: payload
  });
  return {
    message: response?.message || "Cloud copy updated.",
    updatedAt: response?.updated_at || new Date().toISOString()
  };
}

export async function pullHouseholdFromCloud(settings) {
  const sync = settings.sync;
  validateSyncSettings(sync);
  const response = await callSupabaseRpc(sync, "pull_household", {
    p_household_key: sync.householdKey.trim(),
    p_sync_secret: sync.syncSecret
  });
  if (!response?.payload) {
    throw new Error("No cloud household was found for those sync details.");
  }
  return response.payload;
}

function preparePayload(data) {
  return {
    ...data,
    settings: {
      ...data.settings,
      sync: {
        ...data.settings.sync,
        syncSecret: ""
      }
    },
    meta: {
      ...data.meta,
      syncedAt: new Date().toISOString()
    }
  };
}

async function callSupabaseRpc(sync, name, body) {
  const baseUrl = sync.supabaseUrl.trim().replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: syncHeaders(sync.anonKey.trim()),
    body: JSON.stringify(body)
  });

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
    throw new Error(data?.message || data?.error || "Supabase sync request failed.");
  }
  return data;
}

function syncHeaders(key) {
  const headers = {
    apikey: key,
    "Content-Type": "application/json"
  };
  if (!key.startsWith("sb_publishable_")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function validateSyncSettings(sync) {
  if (!syncConfigured({ sync })) {
    throw new Error("Add the Supabase URL, anon key, household key and sync password first.");
  }
  if (!/^https:\/\/.+\.supabase\.co$/i.test(sync.supabaseUrl.trim())) {
    throw new Error("Use the HTTPS Supabase project URL from your Supabase settings.");
  }
}
