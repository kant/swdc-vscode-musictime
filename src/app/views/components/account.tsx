import React, { useState } from "react";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItemText from "@material-ui/core/ListItemText";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import { makeStyles } from "@material-ui/core/styles";
import {
  GoogleIcon,
  MuiGitHubIcon,
  EmailIcon,
  MessageIcon,
  DocumentIcon,
  SpotifyIcon,
  MuiSyncIcon,
  PawIcon,
  MuiDashboardIcon,
  MuiSettingsRemoteIcon,
} from "../icons";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Collapse from "@material-ui/core/Collapse";
import { grey } from "@material-ui/core/colors";
import Workspaces from "./workspaces";
import Divider from "@material-ui/core/Divider";
import AudioControl from "./audio_control";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: "100%",
    width: "100%",
    paddingLeft: 10,
    margin: 0,
  },
  buttonGroupItems: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  secondaryAction: {
    right: 0,
    padding: "14px 20px",
  },
  collapseList: {
    flexGrow: 1,
    width: "100%",
    margin: 0,
    padding: 0,
  },
  collapseListItem: {
    marginLeft: 10,
  },
  primaryListText: {
    fontWeight: 400,
    fontSize: 12,
  },
  secondaryListText: {
    color: grey[500],
    fontWeight: 300,
    fontSize: 12,
    right: 2,
  },
  label: {
    fontWeight: "inherit",
    color: "inherit",
  },
  labelRoot: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0.5, 0),
  },
  listItemIcon: {
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
    minWidth: "36px",
  },
}));

export default function Account(props) {
  const classes = useStyles();
  const stateData = props.stateData;

  /**
   * paused song
   * spotifyPlayerContext
   * {"timestamp":0,"device":{"id":"","is_active":"","is_restricted":false,
   * "name":"","type":"","volume_percent":0},"progress_ms":"","is_playing":false,
   * "currently_playing_type":"","actions":null,"item":null,"shuffle_state":false,
   * "repeat_state":"","context":null}
   *
   * currentlyRunningTrack:
   * {"artist":"Yves V","album":"Echo","genre":"","disc_number":1,"duration":180560,"played_count":0,
   * "track_number":1,"id":"57Zcl7oKKr29qHp38dzzWi","name":"Echo","state":"paused",
   * "volume":100,"popularity":67,
   * "artwork_url":"https://i.scdn.co/image/ab67616d0000b2730b74292f2a1f6825f10f3c4f",
   * "spotify_url":"spotify:track:57Zcl7oKKr29qHp38dzzWi","progress_ms":27898,
   * "uri":"spotify:track:57Zcl7oKKr29qHp38dzzWi"}
   */

  const [accountOpen, setAccountOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);

  function documentationClickHandler() {
    const command = {
      action: "musictime.launchReadme",
      command: "command_execute",
    };
    props.vscode.postMessage(command);
    setAccountOpen(false);
  }

  function dashboardClickHandler() {
    const command = {
      action: "musictime.displayDashboard",
      command: "command_execute",
    };
    props.vscode.postMessage(command);
    setAccountOpen(false);
  }

  function webAnalyticsClickHandler() {
    const command = {
      action: "musictime.launchAnalytics",
      command: "command_execute",
    };
    props.vscode.postMessage(command);
    setAccountOpen(false);
  }

  function submitIssueClickHandler() {
    const command = {
      action: "musictime.submitAnIssue",
      command: "command_execute",
    };
    props.vscode.postMessage(command);
    setAccountOpen(false);
  }

  function switchSpotifyHandler() {
    const command = {
      action: "musictime.switchSpotifyAccount",
      command: "command_execute",
    };
    props.vscode.postMessage(command);
    setAccountOpen(false);
  }

  function connectSpotifyHandler() {
    if (stateData.spotifyUser) {
      return;
    }
    const command = {
      action: "musictime.connectSpotify",
      command: "command_execute",
    };
    props.vscode.postMessage(command);
    setAccountOpen(false);
  }

  function accountClickHandler() {
    setAccountOpen(!accountOpen);
  }

  function handleAudioOptionsClick(event) {
    setOpenMenu(!openMenu);
    setAnchorEl(event.currentTarget);
  }

  function handleAudioOptionsClose() {
    setOpenMenu(false);
  }

  return (
    <Grid container className={classes.root}>
      <Grid item key="account_user_grid" xs={12}>
        <List disablePadding={true} dense={true}>
          <ListItem key="account_manage_item" disableGutters={true} dense={true}>
            <ListItemText key="account_manage" primary="Account" secondary={!stateData.registered ? "Manage your account" : stateData.email} />
            <ListItemSecondaryAction classes={{ root: classes.secondaryAction }}>
              <IconButton onClick={handleAudioOptionsClick}>
                <MuiSettingsRemoteIcon />
              </IconButton>
              <IconButton edge="end" onClick={accountClickHandler}>
                {!stateData.registered ? null : stateData.authType === "github" ? (
                  <MuiGitHubIcon />
                ) : stateData.authType === "google" ? (
                  <GoogleIcon />
                ) : (
                  <EmailIcon />
                )}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Grid>

      <AudioControl
        vscode={props.vscode}
        stateData={props.stateData}
        anchorEl={anchorEl}
        openMenu={openMenu}
        handleAudioOptionsCloseCallback={handleAudioOptionsClose}
      />

      <Collapse in={accountOpen} timeout="auto" unmountOnExit>
        <List className={classes.collapseList} disablePadding={true} dense={true}>
          {!props.stateData.spotifyUser && (
            <ListItem key="spotify-connect" disableGutters={true} dense={true} button onClick={connectSpotifyHandler}>
              <ListItemIcon>
                <SpotifyIcon />
              </ListItemIcon>
              <ListItemText id="spotify-connect-li" primary="Connect Spotify" classes={{ primary: classes.primaryListText }} />
            </ListItem>
          )}

          {props.stateData.spotifyUser && (
            <ListItem key="spotify-account-li" disableGutters={true} dense={true}>
              <ListItemIcon className={classes.listItemIcon}>
                <SpotifyIcon />
              </ListItemIcon>
              <ListItemText
                id="spotify-account-li-text"
                primary={props.stateData.spotifyUser.email}
                secondary={props.stateData.spotifyUser?.product === "premium" ? "Spotify Premium" : "Spotify Open"}
                classes={{ primary: classes.primaryListText }}
              />
            </ListItem>
          )}

          {props.stateData.spotifyUser && (
            <ListItem key="switch-spotify" disableGutters={true} dense={true} button onClick={switchSpotifyHandler}>
              <ListItemIcon className={classes.listItemIcon}>
                <MuiSyncIcon />
              </ListItemIcon>
              <ListItemText id="spotify-switch-li" primary="Switch spotify account" classes={{ primary: classes.primaryListText }} />
            </ListItem>
          )}

          <ListItem key="report-dashboard" disableGutters={true} dense={true} button onClick={dashboardClickHandler}>
            <ListItemIcon className={classes.listItemIcon}>
              <MuiDashboardIcon />
            </ListItemIcon>
            <ListItemText id="report-dashboard-li" primary="Dashboard" classes={{ primary: classes.primaryListText }} />
          </ListItem>

          <ListItem key="web-analytics" disableGutters={true} dense={true} button onClick={webAnalyticsClickHandler}>
            <ListItemIcon className={classes.listItemIcon}>
              <PawIcon />
            </ListItemIcon>
            <ListItemText id="web-analytics-li" primary="More data at Software.com" classes={{ primary: classes.primaryListText }} />
          </ListItem>

          <ListItem key="documentation" disableGutters={true} dense={true} button onClick={documentationClickHandler}>
            <ListItemIcon className={classes.listItemIcon}>
              <DocumentIcon />
            </ListItemIcon>
            <ListItemText id="documentation-li" primary="Documentation" classes={{ primary: classes.primaryListText }} />
          </ListItem>

          <ListItem key="submit-issue" disableGutters={true} dense={true} button onClick={submitIssueClickHandler}>
            <ListItemIcon className={classes.listItemIcon}>
              <MessageIcon />
            </ListItemIcon>
            <ListItemText id="submit-issue-li" primary="Submit an issue" classes={{ primary: classes.primaryListText }} />
          </ListItem>

          <Divider />

          <ListItem key="slack-workspaces" disableGutters={true} dense={true}>
            <Workspaces vscode={props.vscode} stateData={props.stateData} />
          </ListItem>
        </List>
      </Collapse>
    </Grid>
  );
}