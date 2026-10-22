# Deployment: private test site on Mythic Beasts

How GitHub publishes the site to a **private, password-protected test site** on Mythic Beasts (build-plan P9). Nothing here needs a password, a TOTP key or a private key to be pasted into chat, a commit or a public message. You type or paste them only into the Mythic Beasts and GitHub web pages yourself.

## How it works

```text
GitHub "Deploy staging" button
  → builds the site and runs the checks that need no browser
  → SFTP (lftp), using a dedicated key stored as a GitHub secret
  → www/<site folder>/ on margay.mythic-beasts.com
```

- The workflow is [`.github/workflows/deploy-staging.yml`](.github/workflows/deploy-staging.yml). It only runs when someone presses **Run workflow** (Actions tab). The first run is a **dry run** that lists what would change and uploads nothing.
- Everything sensitive lives in a GitHub **environment** called `staging` (Settings → Environments): the SSH key and the hosting username are secrets. The repository holds only the names of the settings.
- The password prompt comes from an `.htpasswd` file that **you create locally and upload once**. It lives in the account's home directory, outside the web folder, so a deploy can never overwrite or publish it. The build adds the login prompt and a `noindex` header only when `STAGING_AUTH_FILE` is set, so production builds are unaffected.
- The upload makes the site folder match the build exactly (`mirror --delete`). The workflow refuses any target that is not a single folder like `www/<site folder>/` (and never `www/log/` or `www/cgi/`).

## One-time setup

### 1. Mythic Beasts: account details

In the customer control panel, open **Hosting & shell accounts** (My hosting accounts) and note the **hosting username** for the account. It is separate from your Mythic Beasts login. The server is `margay.mythic-beasts.com`. On the same page use **Change hosting account password** to set the account's own password. You need it once, in step 3, and type it only into your own terminal.

You do not need to buy a domain, register one with Mythic Beasts, or switch on shell access. The "My domains" page lists only domains registered with or added to Mythic Beasts as domains, so it can be empty. Websites are attached to the hosting account itself (next step). SFTP is documented for hosting accounts without shell access ([Uploading files](https://www.mythic-beasts.com/support/hosting/upload)).

### 2. Mythic Beasts: the test site's folder and address

Each website on a hosting account has its own folder under `www/`, named after the hostname ([Web space](https://www.mythic-beasts.com/support/hosting/webspace)). To create one: **Hosting & shell accounts** → the account → **Add domains or sub-domains**, and add `staging.odysseaninstitute.org`. **Do not change any DNS.** The live site stays on Wix. The folder is then `www/staging.odysseaninstitute.org/`, which is the value of `MB_WEB_DIR` below.

You can view the site before any DNS change at the preview address Mythic Beasts documents for this purpose (see "Transferring in" under [HTTPS and TLS/SSL](https://www.mythic-beasts.com/support/hosting/letsencrypt/transfer-in)): the hostname followed by the server name, here `http://staging.odysseaninstitute.org.margay.mythic-beasts.com/`.

That address is plain `http`, so the staging password would travel unencrypted. Use a throwaway password for your own first tests. **Before inviting reviewers**, give the subdomain real DNS (a `staging` record at Squarespace pointing to `margay.mythic-beasts.com`; it does not touch the main site or email) and switch on https hosting for it in the control panel.

### 3. Authorise the deploy key

A dedicated key pair was created on Will's computer (nothing else uses it):

- public key: `~/.ssh/odyssean_mb_deploy.pub` (safe to share; re-print it with `cat ~/.ssh/odyssean_mb_deploy.pub`)
- private key: `~/.ssh/odyssean_mb_deploy` (never share, never commit)

Mythic Beasts documents one way to enable key login on an account that currently uses a password: put the public key in a file called `authorized_keys` inside a `.ssh` folder in the account's home directory ([SSH key-based authentication](https://www.mythic-beasts.com/support/topics/ssh-keys), last paragraph of "Generate a key pair"). There is no control-panel form for it. Do it once over SFTP, using the standard terminal (OpenSSH, no PuTTY needed):

```bash
sftp USERNAME@margay.mythic-beasts.com     # asks for the hosting account password; type it here, nowhere else
```

At the `sftp>` prompt:

```text
ls -a                                      # is there already a .ssh folder? if yes, do not overwrite an existing authorized_keys
mkdir .ssh
chmod 700 .ssh
lcd ~/.ssh
put odyssean_mb_deploy.pub .ssh/authorized_keys
chmod 600 .ssh/authorized_keys
exit
```

Then check the key works (it must log in without asking for a password):

```bash
sftp -i ~/.ssh/odyssean_mb_deploy -o IdentitiesOnly=yes USERNAME@margay.mythic-beasts.com
```

If it still asks for a password, Mythic Beasts has not enabled key login for this account type. That is the one assumption not confirmed by their documentation. Ask support (`support@mythic-beasts.com`) whether SFTP key login works on the plan; if not, the workflow can use a hosting-account password stored as a GitHub secret instead.

### 4. Create the staging password

Create the password file **on your computer**, so the password is never typed into a chat or a repository:

```bash
printf 'reviewer:%s\n' "$(openssl passwd -apr1)" > htpasswd-staging   # prompts twice; nothing is echoed
sftp -i ~/.ssh/odyssean_mb_deploy USERNAME@margay.mythic-beasts.com
```

At the `sftp>` prompt:

```text
put htpasswd-staging .htpasswd-staging
pwd
exit
```

`pwd` prints the home directory (normally `/home/USERNAME`). Then delete the local copy (`rm htpasswd-staging`). Share the password with reviewers through a password manager, not email or chat.

### 5. GitHub: the `staging` environment

Repository → **Settings → Environments → New environment** named `staging`. Optionally add **Required reviewers** (yourself) so every deploy needs an approval click.

Add these **secrets**:

| Secret       | Value                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `MB_SSH_KEY` | The private key. In Git Bash run `clip < ~/.ssh/odyssean_mb_deploy`, paste into GitHub, then copy something else to clear the clipboard |
| `MB_USER`    | The hosting username                                                                                                                    |

Add these **variables** (not secret):

| Variable           | Value                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MB_HOST`          | `margay.mythic-beasts.com`                                                                                                                                                                                     |
| `MB_KNOWN_HOSTS`   | `margay.mythic-beasts.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIuvh6/0QrBxvGqMPSsgk0cz62Gt4g3jCaKxXewSs/P6` (the server's public key; its fingerprint is `SHA256:712PzwG5If28+DmRmR84EvEyP20GPA/6FyctX1Wu/Co`) |
| `MB_WEB_DIR`       | `www/staging.odysseaninstitute.org/`                                                                                                                                                                           |
| `MB_HTPASSWD_PATH` | `/home/USERNAME/.htpasswd-staging`                                                                                                                                                                             |

The server key and fingerprint were read from `margay.mythic-beasts.com` on 2026-10-22 over an ordinary connection. Before trusting them, compare the fingerprint with the one Mythic Beasts shows in its control panel or support pages, or run `ssh-keyscan -t ed25519 margay.mythic-beasts.com` from a second network.

### 6. First run

Actions → **Deploy staging** → **Run workflow**. Leave **Dry run** ticked first and read the file list in the log. Then run again with it unticked. Open the test site, enter the password, and check the 404 page, a redirect (`/our-work`) and the old PDF links.

## Afterwards

- **Tidy up:** once the secret is saved you can delete the local private key (`rm ~/.ssh/odyssean_mb_deploy`). The secret is then the only copy; to rotate, generate a new pair, replace the public key on the account and the `MB_SSH_KEY` secret.
- **Leaked or lost?** Remove the public key from the hosting account and delete the secret. Nothing else depends on it.
- **Contact form:** switch on `flags.contactForm` in `src/content/settings/site.yaml` only after the mail handler (build-plan 9.3) exists on the host.
- **Launch (P11):** use a separate `production` environment and a separate key, with its own folder and without the password block.

## Troubleshooting

| Symptom                              | Likely cause                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `Login failed` / `Permission denied` | The public key is not on the account, or `MB_USER` is the Mythic Beasts login rather than the hosting username |
| `Host key verification failed`       | `MB_KNOWN_HOSTS` does not match `MB_HOST`                                                                      |
| Workflow stops at "Check the target" | `MB_WEB_DIR` or `MB_HTPASSWD_PATH` is missing or malformed                                                     |
| 500 error on the test site           | The `AuthUserFile` path is wrong. It must be the absolute home path from `pwd`, plus `/.htpasswd-staging`      |
| `mirror: Access failed` on a folder  | `MB_WEB_DIR` does not exist on the account yet. Create the site under **Web settings** first                   |
