import { readFileSync, writeFileSync } from "fs";
import "dotenv/config";
import child_process from "child_process";
import shelljs from "shelljs";

export function getGhToken() {
  let envToken = process.env.GH_TOKEN;
  if (!envToken) {
    const token = readGhCliToken();
    if (token) {
      writeFileSync("./.env", `GH_TOKEN="${token}"`);
      envToken = token;
    } else {
      throw new Error(
        "unexpected error while attempting to authenticate with GitHub"
      );
    }
  }
  return envToken;
}

function isAuthenticatedWithGitHub() {
  if (
    child_process
      .spawnSync("gh", ["auth", "status"])
      .stderr.includes("not logged in")
  ) {
    return false;
  } else {
    return true;
  }
}

function checkInstall() {
  if (shelljs.which("gh") === null) {
    throw new Error(
      "You need to authenticate with GitHub. The easiest way is to install the `gh` CLI and run `gh auth login`. Installation instructions can be found here https://cli.github.com/manual/installation. Alternatively you can get a personal access token and set the `GH_TOKEN` environment variable on your machine or in a .env file."
    );
  }
  return true;
}

function login(isRecursing=false) {
  if (checkInstall() && !isAuthenticatedWithGitHub()) {
    throw new Error("It looks like you have the `gh` CLI installed but you haven't authenticated. Please run `gh auth login` and try again.")
  }
  return true
}

function readGhCliToken(isRecursing = false) {
  // first, check in a known location for credentials
  const HOME = process.env.HOME;
  const hosts = readFileSync(`${HOME}/.config/gh/hosts.yml`).toString();
  for (let line of hosts.split("\n")) {
    if (line.includes("oauth_token")) {
      return line.split("oauth_token: ")[1];
    }
  }

  if (!isRecursing) {
    if (login()) {
      return readGhCliToken(true);
    }
  }
  throw new Error("Could not authenticate with GitHub");
}
