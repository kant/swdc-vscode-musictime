import { CodyConfig, getUserProfile, setConfig } from "cody-music";
import { commands, window } from "vscode";
import { api_endpoint, YES_LABEL } from "../Constants";
import { isResponseOk, softwareGet, softwarePut } from "../HttpClient";
import SoftwareIntegration from "../model/SoftwareIntegration";
import { getPluginId, getPluginType, getVersion, isMac, launchWebUrl } from "../Util";
import { SpotifyUser } from "cody-music/dist/lib/profile";
import { MusicDataManager } from "../music/MusicDataManager";
import { MusicCommandManager } from "../music/MusicCommandManager";
import { getAuthCallbackState, getIntegrations, getItem, getPluginUuid, setAuthCallbackState, setItem } from "./FileManager";
import { getUser } from "./UserStatusManager";
import { clearSpotifyIntegrations, updateSpotifyIntegrations } from "./IntegrationManager";

const queryString = require("query-string");

let spotifyUser: SpotifyUser = null;
let spotifyClientId: string = "";
let spotifyClientSecret: string = "";

export function getConnectedSpotifyUser() {
  return spotifyUser;
}

export function hasSpotifyUser() {
  return !!(spotifyUser && spotifyUser.product);
}

export async function isPremiumUser() {
  if (spotifyUser && spotifyUser.product !== "premium") {
    // check 1 more time
    await populateSpotifyUser(true);
  }
  return !!(spotifyUser && spotifyUser.product === "premium");
}

export async function updateSpotifyClientInfo() {
  const resp = await softwareGet("/auth/spotify/clientInfo", getItem("jwt"));
  if (isResponseOk(resp)) {
    // get the clientId and clientSecret
    spotifyClientId = resp.data.clientId;
    spotifyClientSecret = resp.data.clientSecret;
  }
}

export async function connectSpotify() {
  // check if they're already connected, if so then ask if they would
  // like to continue as we'll need to disconnect the current connection
  const spotifyIntegration = getSpotifyIntegration();
  if (spotifyIntegration) {
    // disconnectSpotify
    const selection = await window.showInformationMessage(`Connect with a different Spotify account?`, ...[YES_LABEL]);
    if (!selection || selection !== YES_LABEL) {
      return;
    }
    // disconnect the current connection
    await disconnectSpotify(false /*confirmDisconnect*/);
  }

  const auth_callback_state = getAuthCallbackState();

  let queryStr = queryString.stringify({
    plugin: getPluginType(),
    plugin_uuid: getPluginUuid(),
    pluginVersion: getVersion(),
    plugin_id: getPluginId(),
    mac: isMac(),
    auth_callback_state,
    plugin_token: getItem("jwt"),
  });

  const endpoint = `${api_endpoint}/auth/spotify?${queryStr}`;
  launchWebUrl(endpoint);
}

export async function populateSpotifyUser(hardRefresh = false) {
  const spotifyIntegration = getSpotifyIntegration();
  if (spotifyIntegration && (hardRefresh || !spotifyUser || !spotifyUser.id)) {
    // get the user
    spotifyUser = await getUserProfile();
  }
}

export async function switchSpotifyAccount() {
  const selection = await window.showInformationMessage(`Are you sure you would like to connect to a different Spotify account?`, ...[YES_LABEL]);
  if (selection === YES_LABEL) {
    await disconnectSpotify(false);
    connectSpotify();
  }
}

export function getSpotifyIntegration(): SoftwareIntegration {
  const spotifyIntegrations: SoftwareIntegration[] = getIntegrations().filter(
    (n) => n.name.toLowerCase() === "spotify" && n.status.toLowerCase() === "active"
  );
  if (spotifyIntegrations?.length) {
    // get the last one in case we have more than one.
    // the last one is the the latest one created.
    return spotifyIntegrations[spotifyIntegrations.length - 1];
  }
  return null;
}

export function removeSpotifyIntegration() {
  clearSpotifyIntegrations();

  // clear the tokens from cody config
  updateCodyConfig();
  // update the spotify user to null
  spotifyUser = null;
}

export async function disconnectSpotify(confirmDisconnect = true) {
  const selection = confirmDisconnect
    ? await window.showInformationMessage(`Are you sure you would like to disconnect Spotify?`, ...[YES_LABEL])
    : YES_LABEL;

  if (selection === YES_LABEL) {
    await softwarePut(`/auth/spotify/disconnect`, {}, getItem("jwt"));

    // remove the integration
    removeSpotifyIntegration();

    // clear the spotify playlists
    MusicDataManager.getInstance().disconnect();

    setTimeout(() => {
      commands.executeCommand("musictime.refreshPlaylist");
      commands.executeCommand("musictime.refreshRecommendations");
    }, 1000);

    // update the status bar
    MusicCommandManager.syncControls(MusicDataManager.getInstance().runningTrack, false);

    if (confirmDisconnect) {
      window.showInformationMessage(`Successfully disconnected your Spotify connection.`);
    }
  }
}

/**
 * Update the cody config settings for cody-music
 */
export async function updateCodyConfig() {
  const spotifyIntegration: SoftwareIntegration = getSpotifyIntegration();

  if (!spotifyIntegration) {
    spotifyUser = null;
  }

  const codyConfig: CodyConfig = new CodyConfig();
  codyConfig.enableItunesDesktop = false;
  codyConfig.enableItunesDesktopSongTracking = isMac();
  codyConfig.enableSpotifyDesktop = isMac();
  codyConfig.spotifyClientId = spotifyClientId;
  codyConfig.spotifyAccessToken = spotifyIntegration ? spotifyIntegration.access_token : null;
  codyConfig.spotifyRefreshToken = spotifyIntegration ? spotifyIntegration.refresh_token : null;
  codyConfig.spotifyClientSecret = spotifyClientSecret;
  setConfig(codyConfig);
}

export async function migrateAccessInfo() {
  if (!getSpotifyIntegration()) {
    const legacyAccessToken = getItem("spotify_access_token");
    if (legacyAccessToken) {
      // get the user
      const user = await getUser(getItem("jwt"));
      if (user) {
        // update the integrations
        await updateSpotifyIntegrations(user);
        updateCodyConfig();
      }
    }

    // remove the legacy spotify_access_token to so we don't have to check
    // if the user needs to migrate any longer
    setItem("spotify_access_token", null);
  }
}
