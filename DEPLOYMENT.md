# Deployment: private test site on Mythic Beasts

How GitHub publishes the site to a **private, password-protected test site** on Mythic Beasts (build-plan P9). Nothing here needs a password, a TOTP key or a private key to be pasted into chat, a commit or a public message. You type or paste them only into the Mythic Beasts and GitHub web pages yourself.

## How it works

```text
GitHub "Deploy staging" button
  → builds the site and runs the checks that need no browser
  → rsync over SSH, using a dedicated key stored as a GitHub secret
  → www/<site folder>/ on the Mythic Beasts hosting account
```

- The workflow is [`.github/workflows/deploy-staging.yml`](.github/workflows/deploy-staging.yml). It only runs when someone presses **Run workflow** (Actions tab). The first run is a **dry run** that lists what would change and uploads nothing.
- Everything sensitive lives in a GitHub **environment** called `staging` (Settings → Environments). The repository holds only the names of those settings.
- The password prompt comes from an `.htpasswd` file that **you create on the server**. It is outside the web folder, so a deploy can never overwrite or publish it. The build adds the login prompt and a `noindex` header only when `STAGING_AUTH_FILE` is set, so production builds are unaffected.
- `rsync --delete` makes the folder match the build exactly. The workflow refuses any target that is not a single folder like `www/<site folder>/` (and never `www/log/` or `www/cgi/`).

## One-time setup

### 1. Mythic Beasts: shell access and account details

In the customer control panel, open **My hosting accounts** and note, for the account that will hold the test site:

- the **server hostname** (for example `ocelot.mythic-beasts.com`; it depends on the server your account lives on),
- the **hosting username** (separate from your Mythic Beasts login),
- that **shell access** is switched on. Uploading with SSH keys needs it. If it is not offered on the current plan, the support team ([Shell access](https://www.mythic-beasts.com/support/hosting/shell_access)) can say what changes, and the fallback is SFTP (ask Devin to adapt the workflow).

### 2. Mythic Beasts: the test site's folder

Each website on a hosting account has its own folder under `www/` (see [Web space](https://www.mythic-beasts.com/support/hosting/webspace)). Pick the hostname that will serve the test site, make sure it is set up under **Web settings**, and note its folder name. The value used below is `www/<that folder>/`, with the trailing slash.

### 3. Authorise the deploy key

A dedicated key pair was created on Will's computer (nothing else uses it):

- public key: `~/.ssh/odyssean_mb_deploy.pub` (safe to share; it is shown in the Devin chat and can be re-printed with `cat ~/.ssh/odyssean_mb_deploy.pub`)
- private key: `~/.ssh/odyssean_mb_deploy` (never share, never commit)

Add the **public** key to the hosting account in the control panel (the SSH keys section of the hosting account). If your panel has no such section, append the line to `~/.ssh/authorized_keys` on the account once, over SFTP or an SSH password login.

Check it works from your computer:

```bash
ssh -i ~/.ssh/odyssean_mb_deploy -o IdentitiesOnly=yes USERNAME@HOSTNAME 'echo ok'
```

### 4. Create the staging password (on the server)

Log in with SSH and create the password file in your **home** directory (not under `www/`):

```bash
ssh -i ~/.ssh/odyssean_mb_deploy USERNAME@HOSTNAME
htpasswd -c ~/.htpasswd-staging reviewer     # prompts for the password; nothing is echoed
pwd                                          # prints /home/USERNAME, needed below
```

Share the password with reviewers through your password manager, not email or chat. If `htpasswd` is not installed, use `printf 'reviewer:%s\n' "$(openssl passwd -apr1)" > ~/.htpasswd-staging`.

### 5. GitHub: the `staging` environment

Repository → **Settings → Environments → New environment** named `staging`. Optionally add **Required reviewers** (yourself) so every deploy needs an approval click.

Add these **secrets**:

| Secret           | Value                                                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `MB_SSH_KEY`     | The private key. In Git Bash run `clip < ~/.ssh/odyssean_mb_deploy`, paste into GitHub, then copy something else to clear the clipboard |
| `MB_KNOWN_HOSTS` | Output of `ssh-keyscan -t ed25519 HOSTNAME`. Check the fingerprint against the one in the control panel                                 |
| `MB_HOST`        | The server hostname                                                                                                                     |
| `MB_USER`        | The hosting username                                                                                                                    |

Add these **variables** (not secret):

| Variable           | Example                            |
| ------------------ | ---------------------------------- |
| `MB_WEB_DIR`       | `www/<site folder>/`               |
| `MB_HTPASSWD_PATH` | `/home/USERNAME/.htpasswd-staging` |

### 6. First run

Actions → **Deploy staging** → **Run workflow**. Leave **Dry run** ticked first and read the `rsync` list. Then run again with it unticked. Open the test site, enter the password, and check the 404 page, a redirect (`/our-work`) and the old PDF links.

## Afterwards

- **Tidy up:** once the secret is saved you can delete the local private key (`rm ~/.ssh/odyssean_mb_deploy`). The secret is then the only copy; to rotate, generate a new pair, replace the public key on the server and the `MB_SSH_KEY` secret.
- **Leaked or lost?** Remove the public key from the hosting account and delete the secret. Nothing else depends on it.
- **Contact form:** switch on `flags.contactForm` in `src/content/settings/site.yaml` only after the mail handler (build-plan 9.3) exists on the host.
- **Launch (P11):** use a separate `production` environment and a separate key, with its own folder and without the password block.

## Troubleshooting

| Symptom                                  | Likely cause                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `Permission denied (publickey)`          | The public key is not on the account, or `MB_USER` is the Mythic Beasts login rather than the hosting username |
| `Host key verification failed`           | `MB_KNOWN_HOSTS` does not match `MB_HOST`. Re-run `ssh-keyscan` for the same hostname                          |
| `rsync: command not found` on the server | The host has no rsync. Ask Devin to switch the upload step to SFTP                                             |
| Workflow stops at "Check the target"     | `MB_WEB_DIR` or `MB_HTPASSWD_PATH` is missing or malformed                                                     |
| 500 error on the test site               | The `AuthUserFile` path is wrong. It must be the absolute path printed by `pwd`                                |
