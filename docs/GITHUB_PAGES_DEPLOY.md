# Deploy Household Assistant To GitHub Pages

This guide is written for someone who has never used GitHub before.

When finished, the app will have an HTTPS address like:

`https://your-github-name.github.io/household-assistant/`

That HTTPS address is what lets Android install the app as a Progressive Web App.

## Before You Start

You need:

- A GitHub account
- The app folder from this build
- A computer browser, preferably Chrome or Microsoft Edge

The app files are already prepared for GitHub Pages. Do not rename these files:

- `index.html`
- `manifest.json`
- `service-worker.js`
- `version.json`
- `.nojekyll`
- `styles.css`
- `js/`
- `icons/`

## Step 1: Create A GitHub Account

1. Go to `https://github.com`
2. Choose **Sign up**
3. Follow the account creation steps
4. Verify your email address if GitHub asks you to

## Step 2: Create A New Repository

1. While signed in to GitHub, click the **+** button in the top-right corner
2. Choose **New repository**
3. Repository name: `household-assistant`
4. Choose **Public**
5. Tick **Add a README file**
6. Click **Create repository**

Public is the easiest option for GitHub Pages. Do not store private passwords or secrets in the app files. Your household data is stored on your own devices, not inside the GitHub repository.

## Step 3: Upload The App Files

1. Open your new `household-assistant` repository on GitHub
2. Click **Add file**
3. Choose **Upload files**
4. Drag all files and folders from this app folder into the upload area
5. Make sure `index.html` is at the top level, not inside another folder
6. Scroll down to **Commit changes**
7. In the message box, type `Upload alpha PWA`
8. Click **Commit changes**

The final repository should show files such as `index.html`, `manifest.json`, `service-worker.js`, `styles.css`, and folders named `js` and `icons`.

## Step 4: Turn On GitHub Pages

1. In the repository, click **Settings**
2. In the left menu, click **Pages**
3. Under **Build and deployment**, find **Source**
4. Choose **Deploy from a branch**
5. Under **Branch**, choose `main`
6. Choose folder `/ (root)`
7. Click **Save**

GitHub may take a few minutes to publish the site.

## Step 5: Open The App

1. Stay on the **Pages** settings screen
2. Wait until GitHub shows a live site address
3. Open the address
4. It should look like:

`https://your-github-name.github.io/household-assistant/`

If you see the Household Assistant login or setup screen, deployment worked.

## Step 6: Install On Android

1. On your Android phone, open Chrome
2. Go to your GitHub Pages app address
3. Wait for the app to load
4. Tap the Chrome menu
5. Tap **Install app**
6. If Chrome only shows **Add to Home screen**, use that for now
7. Open Household Assistant from your home screen
8. Go to **Settings**
9. Tap **Check for updates**
10. Tap **Turn on reminders** if you want to test notifications

## Step 7: Install On Windows

1. Open the GitHub Pages app address in Microsoft Edge or Chrome
2. Look for the install icon in the address bar
3. Click **Install**
4. The app will open in its own window

## Updating The App Later

1. Export a backup from Settings
2. Replace the app files in the GitHub repository
3. Commit the changes
4. Wait a few minutes for GitHub Pages to publish
5. Open the installed app
6. Go to Settings
7. Tap **Check for updates**
8. Tap **Apply safe update** if an update is waiting

Normal updates replace app files only. Household data should stay on the device unless you clear browser data, uninstall the app and remove site data, or change to a different web address.

## Moving Data To Another Phone

1. On the old phone, open Settings
2. Tap **Export data backup**
3. Save the backup file somewhere safe
4. On the new phone, install the app from the GitHub Pages address
5. Open Settings
6. Tap **Import backup**
7. Choose the backup file

## Common Problems

### I do not see "Install app" on Android

Check that the address starts with `https://`. Android requires HTTPS for a proper PWA install.

### The app opens but does not update

Open Settings and tap **Check for updates**. If that does not work, close the app completely and reopen it.

### My data is missing

Make sure you opened the exact same GitHub Pages address as before. Browser storage belongs to a specific web address. If you changed the repository name or GitHub account, import your backup.

### I uploaded the files but GitHub Pages shows a file list or README

Make sure `index.html` is at the top level of the repository, not inside another folder.

### Notifications do not work

Open the installed app from the home screen, go to Settings, and tap **Turn on reminders**. Android may also require notification permission in system settings.
