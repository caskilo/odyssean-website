# Deployment: GitHub to Mythic Beasts

GitHub Actions builds the site and uploads `dist/` to a Mythic Beasts hosting account over SFTP with a key-only login. The workflow is [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It runs only when started by hand (Actions tab, Run workflow) while the pipeline is being proven. The first run is a dry run: it connects, lists what would change and uploads nothing.

## What is documented and what the first run proves

| Question                                            | Status                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server is `margay.mythic-beasts.com`                | Given by Mythic Beasts for this account. Files are uploaded to the folder `www/<hostname>/` ([Uploading files](https://www.mythic-beasts.com/support/hosting/upload), [Web space](https://www.mythic-beasts.com/support/hosting/webspace)).                                                              |
| SFTP works on the account without the shell option  | Documented for hosting accounts. **Proved by the first dry run.**                                                                                                                                                                                                                                        |
| Key login works for SFTP on this account            | Mythic Beasts says key login can be enabled on an account that uses a password by placing the public key in `~/.ssh/authorized_keys` ([SSH key-based authentication](https://www.mythic-beasts.com/support/topics/ssh-keys)). They do not say it applies to every plan. **Proved by the first dry run.** |
| Which folder the real site will use                 | Not decided here. A folder only serves a website once a hostname is attached to the account in the control panel. The pipeline does not depend on that, so the first runs use a throwaway folder such as `www/upload-test/`.                                                                             |
| The server's host key (`MB_KNOWN_HOSTS`) is genuine | Read with `ssh-keyscan` on one network, not yet compared with Mythic Beasts. Do the comparison in step 3.                                                                                                                                                                                                |

Nothing else is assumed. In particular there is no staging site, DNS change, domain registration or password protection in this pipeline.

## One-time setup

### 1. Find the hosting username

Control panel → **Hosting & shell accounts** → the account. The hosting username is separate from your Mythic Beasts login.

### 2. Put the public key on the account

A key pair for this was created on Will's computer: `~/.ssh/odyssean_mb_deploy` (private, never share) and `~/.ssh/odyssean_mb_deploy.pub` (public). This is the only step that needs the hosting account password, and it is typed into your own terminal only. Mythic Beasts documents no control-panel form for keys, so use their `authorized_keys` method over SFTP:

```bash
sftp USERNAME@margay.mythic-beasts.com
```

At the `sftp>` prompt (if `ls -a` shows a `.ssh` folder with an existing `authorized_keys`, do not overwrite it; add the line instead):

```text
ls -a
mkdir .ssh
chmod 700 .ssh
lcd ~/.ssh
put odyssean_mb_deploy.pub .ssh/authorized_keys
chmod 600 .ssh/authorized_keys
exit
```

Check the key works without a password:

```bash
sftp -i ~/.ssh/odyssean_mb_deploy -o IdentitiesOnly=yes -o PasswordAuthentication=no USERNAME@margay.mythic-beasts.com
```

If this fails, key login is not enabled for the account. Ask Mythic Beasts support. The workflow will fail the same way, so there is no point continuing until this works.

### 3. Check the server's host key

The first `sftp` login above prints the server's fingerprint. Compare it with the one Mythic Beasts shows for the server. What was read from `margay.mythic-beasts.com` on 2026-10-22:

```text
margay.mythic-beasts.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIuvh6/0QrBxvGqMPSsgk0cz62Gt4g3jCaKxXewSs/P6
SHA256:712PzwG5If28+DmRmR84EvEyP20GPA/6FyctX1Wu/Co
```

### 4. GitHub: the `production` environment

Repository → **Settings → Environments → New environment** named `production`. Optionally add yourself as a required reviewer.

Secrets:

| Secret       | Value                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `MB_SSH_KEY` | The private key. In Git Bash run `clip < ~/.ssh/odyssean_mb_deploy`, paste into GitHub, then copy something else to clear the clipboard |
| `MB_USER`    | The hosting username                                                                                                                    |

Variables:

| Variable         | Value                                                                         |
| ---------------- | ----------------------------------------------------------------------------- |
| `MB_HOST`        | `margay.mythic-beasts.com`                                                    |
| `MB_KNOWN_HOSTS` | The first line from step 3                                                    |
| `MB_WEB_DIR`     | `www/upload-test/` (a throwaway folder; must start with `www/`, end with `/`) |

### 5. Run it

Actions → **Deploy to Mythic Beasts** → **Run workflow**, with **Dry run** ticked. A dry run that lists the files proves login, host key and path. Run again unticked to upload. Look at the folder over SFTP to confirm.

## Failure guide

| Symptom                               | Cause                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `Login failed` or `Permission denied` | Key not accepted: step 2, or `MB_USER` is the Mythic Beasts login, not the hosting username |
| `Host key verification failed`        | `MB_KNOWN_HOSTS` does not match `MB_HOST`                                                   |
| Stops at "Check the target"           | `MB_WEB_DIR` missing or malformed                                                           |
| Build fails                           | Same as in CI; fix the content or code                                                      |

## Before this deploys the real site

Decisions still open and not part of proving the pipeline: which hostname the site will serve on and how it is attached to the account, how the old site is cut over, and whether pushes to `main` should deploy automatically after CI (see the plan in README). The generated `dist/.htaccess` already contains the redirects, security headers and caching.
