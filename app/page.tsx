"use client";

import { useEffect, useState } from "react";

type Notice = {
  id: string;
  startAt: string;
  endAt: string | null;
  facilities: string;
  reason: string;
  remarks: string;
  sourceUrl: string;
  mainPool: boolean;
};

type PoolStatus = {
  swpId: number;
  name: string;
  phone?: string;
  sourceUrl: string;
  notices: Notice[];
  error?: string;
};

type StatusResponse = {
  checkedAt: string;
  pools: PoolStatus[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-HK", {
    timeZone: "Asia/Hong_Kong",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

export default function HomePage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/status")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load pool status");
        }
        return response.json() as Promise<StatusResponse>;
      })
      .then(setStatus)
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "Could not load pool status");
      })
      .finally(() => setLoading(false));
  }, []);

  async function enableNotifications(): Promise<void> {
    setEnabling(true);
    setMessage("");

    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("This browser does not support Web Push notifications.");
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      const configResponse = await fetch("/api/push/config");
      const config = (await configResponse.json()) as { publicKey?: string };

      if (!configResponse.ok || !config.publicKey) {
        throw new Error("Push notifications are not configured yet.");
      }

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey) as unknown as BufferSource,
        }));

      const saveResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!saveResponse.ok) {
        throw new Error("The notification subscription could not be saved.");
      }

      setMessage("Notifications are enabled. You will receive at most one daily summary.");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Could not enable notifications.");
    } finally {
      setEnabling(false);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Hong Kong / LCSD</p>
          <h1>Know before you swim.</h1>
          <p className="lede">
            A quiet daily check for Victoria Park and Morrison Hill Swimming Pools.
            We only send a notification when the daily summary has something relevant.
          </p>
        </div>
      </header>

      <section className="card setup" aria-labelledby="alerts-heading">
        <div>
          <h2 id="alerts-heading">Daily alerts</h2>
          <p>
            On iPhone, add this site to the Home Screen first, then enable notifications
            from the installed app.
          </p>
          {message ? <p className="message">{message}</p> : null}
        </div>
        <button type="button" onClick={enableNotifications} disabled={enabling}>
          {enabling ? "Enabling..." : "Enable notifications"}
        </button>
      </section>

      <section className="card" aria-labelledby="status-heading">
        <div className="section-heading">
          <h2 id="status-heading">Pool status</h2>
          {status ? (
            <span className="updated">Checked {formatDate(status.checkedAt)}</span>
          ) : null}
        </div>

        {loading ? <p className="footnote">Checking LCSD...</p> : null}

        {status ? (
          <div className="pool-list">
            {status.pools.map((pool) => (
              <article className="pool" key={pool.swpId}>
                <h3>{pool.name}</h3>
                <p className="pool-meta">
                  <a href={pool.sourceUrl} target="_blank" rel="noreferrer">
                    Official LCSD page
                  </a>
                  {pool.phone ? ` / ${pool.phone}` : ""}
                </p>

                {pool.error ? <p className="error">Data unavailable: {pool.error}</p> : null}
                {!pool.error && pool.notices.length === 0 ? (
                  <p className="clear">No temporary closure notices found.</p>
                ) : null}
                {pool.notices.map((notice) => (
                  <div className={`notice${notice.mainPool ? " notice-main-pool" : ""}`} key={notice.id}>
                    {notice.mainPool ? <p className="notice-badge">Main Pool</p> : null}
                    <p>
                      <strong>
                        {formatDate(notice.startAt)} to {notice.endAt ? formatDate(notice.endAt) : "until further notice"}
                      </strong>
                    </p>
                    <p>Temporarily unavailable: {notice.facilities}</p>
                    <p>Reason: {notice.reason}</p>
                    {notice.remarks !== "N/A" ? <p>Details: {notice.remarks}</p> : null}
                  </div>
                ))}
              </article>
            ))}
          </div>
        ) : null}

        <p className="footnote">
          LCSD information is subject to change. Check the official page or call the pool
          before travelling. The first MVP tracks temporary closure notices; annual
          maintenance and weekly cleansing calculations are follow-up work.
        </p>
      </section>
    </main>
  );
}
