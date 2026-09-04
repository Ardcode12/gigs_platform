/**
 * Runtime configuration.
 *
 * The phone runs the app, so `localhost` points at the phone — not at your laptop.
 * Put your machine's LAN IP here (the same address `expo start --host lan` prints)
 * and make sure uvicorn is started with `--host 0.0.0.0`.
 */

// e.g. '192.168.1.7' — `hostname -I` on Linux, `ipconfig getifaddr en0` on macOS.
export const API_HOST = '10.71.25.35';
export const API_PORT = 8000;

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;
export const WS_URL = `ws://${API_HOST}:${API_PORT}/api/ws`;

/** Rough city driving speed, used only for the "N min away" fallback label. */
export const AVG_SPEED_KMPH = 22;
