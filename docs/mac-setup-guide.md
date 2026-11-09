# USJ TeleDent: step-by-step MacBook setup guide

This guide starts from zero. You do not need to know programming or have used Terminal before. Follow the numbered steps in order.

You will install Node.js, download the project, install its required packages, and open the website in your Mac's browser. Internet access is required for the downloads and first installation.

**This project uses port 3001.** Your other project can keep using port 3000. The homepage for this project is [http://127.0.0.1:3001](http://127.0.0.1:3001).

**Use fictional patients and photos only.** This project is a local demonstration. The doctor passwords below are shared demonstration passwords, visible to everyone with this project.

## 1. Download and extract the project

If you already downloaded the project ZIP, start at instruction 4.

1. Open Safari or Chrome.
2. Open [the USJ TeleDent repository](https://github.com/Joseph-elias/USJ-TeleDent). If GitHub asks you to sign in, use a GitHub account that has access to the repository. The doctor accounts below are for the website, not GitHub.
3. Click the green **Code** button, then **Download ZIP**. You do not need Git or GitHub Desktop. A branch is a version of the project; use the branch your project owner shared. If no other branch was specified, leave the repository's initially selected branch unchanged.
4. Open **Finder**, the blue smiling face icon in the Dock at the bottom of the screen.
5. Click **Downloads** in Finder's left sidebar.
6. Find the downloaded ZIP. Double-click it to extract a normal folder. Safari may already have extracted it.
7. Open the extracted folder. Find the folder containing **package.json**, **package-lock.json**, **src**, and **README.md**. This is the project folder. If there is another folder inside the first folder, open it until you find those files.
8. For simpler commands later, rename that project folder to **USJ-TeleDent**: select the folder, press **Return**, type `USJ-TeleDent`, and press **Return** again. If that name already exists, keep a different name and use the folder-dragging instructions in step 5 instead of the example path.
9. Leave the project folder in Downloads for this guide. Do not delete or move it while the website is running.

Download a fresh ZIP on the Mac rather than copying the Windows `node_modules` or `.next` folders. The Mac needs its own installed packages. A fresh download also starts with empty patient data.

## 2. Install Node.js

Node.js runs the website on your computer. Its installer also includes **npm**, which installs the packages the project needs.

1. In your browser, open [the official Node.js download page](https://nodejs.org/en/download).
2. Select **Node.js 22.x**, using **22.23.3 or a newer 22.x patch**. The project was tested with 22.23.3. The download page may initially select a different major version; choose 22.x for the closest match to the tested setup.
3. Select **macOS** and the **Installer (.pkg)** download. Use the installer rather than the shell installation commands shown on the page.
4. If architecture is requested, click the **Apple menu  > About This Mac**. A **Chip** such as Apple M1, M2, M3, or newer means **ARM64**. An **Intel processor** means **x64**. Choose the matching download if separate installers are offered.
5. Open Finder > Downloads and double-click the downloaded `.pkg` file.
6. Follow the installer's **Continue**, **Agree**, and **Install** prompts.
7. If the installer asks for authorization, use your **Mac login password** or Touch ID. This is not a doctor password. A managed Mac may require its administrator to authorize installation.
8. Finish the installer and close it.

You do not need to install a database, Supabase, Docker, Homebrew, or a code editor for these setup steps. You do not need to create `.env.local` or enter API keys. The Supabase instructions elsewhere in the README are deferred and are not part of this local setup.

## 3. Open Terminal on your Mac

Terminal is an app where you type commands. It is already installed on macOS.

1. Hold **Command (⌘)** and press **Space**. A Spotlight search box opens.
2. Type **Terminal**.
3. Press **Return** to open Terminal.
4. You should see a window with a line ending in something like `%` or `$`. That line means Terminal is ready for a command.

Another way: open **Finder > Applications > Utilities**, then double-click **Terminal**. See [Apple's instructions for opening Terminal](https://support.apple.com/guide/terminal/open-or-quit-terminal-apd5265185d-f365-44cb-8b09-71a064a42125/mac).

### How to open a new Terminal window

1. Click the Terminal app so that **Terminal** appears beside the Apple menu at the top of the screen.
2. Press **Command (⌘) + N**. Or choose **Shell > New Window > New Window with Profile – Basic**; the profile name may differ.
3. Keep the original window open if it is running the website. Use the new window for other commands.

These controls are described in [Apple's guide to Terminal windows and tabs](https://support.apple.com/guide/terminal/open-new-terminal-windows-and-tabs-trmlb20c7888/mac).

Each Terminal window has its own current folder. A new window may start in your home folder, so repeat step 5 in that window before running project commands.

### How to enter commands

- Copy the text inside a command box, paste it into Terminal using **Command (⌘) + V**, then press **Return**.
- Enter one command at a time. Wait for it to finish before entering the next command, unless the guide says the command should stay running.
- Do not copy the surrounding backticks, a `%` or `$` prompt, or example output.
- **Command + C** copies selected text. **Control + C** stops a running command. They are different keys.

## 4. Check that Node.js and npm are installed

In Terminal, enter:

```sh
node --version
```

You should see a version such as `v22.23.3` or a newer 22.x patch. Then enter:

```sh
npm --version
```

You should see another version number. It does not need to match the Node.js number.

If either command says `command not found`, quit Terminal using **Command + Q**, reopen it using step 3, and try again. If it still fails, complete the Node.js installer again. If Node is older than 22.23.3, install the recommended version before continuing.

## 5. Tell Terminal which folder contains the project

If you renamed the project folder to `USJ-TeleDent` and left it in Downloads, enter:

```sh
cd ~/Downloads/USJ-TeleDent
```

`cd` means “change directory,” or open a folder inside Terminal. `~` means your Mac user folder.

**If your folder has another name or location, use this method instead:**

1. In Terminal, type `cd` followed by **one space**. Do not press Return yet.
2. Open Finder and find the project folder containing `package.json`.
3. Drag that **folder** from Finder into the Terminal window. Terminal inserts its path, including any necessary escaping for spaces.
4. Click Terminal and press **Return**.

Check the folder by entering:

```sh
pwd
```

This prints the current folder's full path. Then enter:

```sh
ls
```

You should see `package.json`, `package-lock.json`, `src`, and `README.md` among the listed names. If you do not, return to Finder and locate the correct project folder before continuing.

## 6. Install the project packages and doctor accounts

While Terminal is inside the project folder, enter:

```sh
npm ci
```

Keep the Mac connected to the internet. This may take several minutes. Wait until the `%` or `$` prompt returns. Installation messages will scroll past; ordinary notices and warnings do not necessarily mean it failed. If it ends with `npm error`, use the troubleshooting section below before continuing.

This command reads the project's package lockfile, installs the required packages into `node_modules`, and automatically creates the six demonstration doctor accounts. You may see a French message saying six fictional accounts were created, followed by their credentials.

If the automatic account creation was skipped, enter:

```sh
npm run dentists:seed
```

You may also run this command to confirm the accounts exist. If it says **Les comptes locaux existent déjà**, the local account file already exists and was left unchanged. The command does not replace old passwords.

You normally install packages only once per downloaded copy, not each time you open the website.

## 7. Start the website

Port **3001** is already configured in the project's `package.json`, so you do not need to add a port number to the normal start command below.

If this project was running before the port changed, click its Terminal window and press **Control + C** first. Then enter the command below to restart it on port 3001. Keep the Terminal window for your other project running on port 3000.

Enter:

```sh
npm run dev -- --hostname 127.0.0.1
```

Wait until Terminal says the application is ready. **Leave this Terminal window open and running.** The prompt will not return while the website is running; that is expected. The first page may take a little longer to load while it compiles.

The address `127.0.0.1` means this Mac itself. With this command, the website is available on this Mac; another phone or computer cannot use that address to reach it.

## 8. Open the website in your browser

1. Open Safari or Chrome.
2. Press **Command (⌘) + L** to select the address bar.
3. Paste `http://127.0.0.1:3001` and press **Return**. Use `http`, including the final port number `:3001`.

Useful pages:

| Page | Address |
| --- | --- |
| Homepage | [http://127.0.0.1:3001](http://127.0.0.1:3001) |
| Patient form | [http://127.0.0.1:3001/patient](http://127.0.0.1:3001/patient) |
| Doctor login | [http://127.0.0.1:3001/dentist/login](http://127.0.0.1:3001/dentist/login) |
| Doctor dashboard | [http://127.0.0.1:3001/dentist](http://127.0.0.1:3001/dentist) |

The dashboard asks you to log in if you are not already signed in. The top language selector offers French, English, and Arabic.

## 9. Doctor emails and passwords for every department

Open [the doctor login page](http://127.0.0.1:3001/dentist/login). Copy the email and password from the **same row** below. Passwords are case-sensitive; copy them exactly without backticks or extra spaces.

| Department | Doctor email | Password |
| --- | --- | --- |
| Chirurgie bucco-dentaire | service1.710a69@usj-teledent.test | `3Fo7tnUmCVpNZd2Q5sl4` |
| Parodontologie | service2.710a69@usj-teledent.test | `8Etzc8HKeKKVYMH_ezKd` |
| Endodontie | service3.710a69@usj-teledent.test | `CnRLDbAsQlJsoyc34YtJ` |
| Dentisterie restauratrice / conjointe | service4.710a69@usj-teledent.test | `zbHn_XxxDn3hpe6igk9h` |
| Pédodontie | service5.710a69@usj-teledent.test | `Kc4Es5idUAk-T61kcOS5` |
| Urgences | service6.710a69@usj-teledent.test | `DY80EZ7Pm8BFccyZRw2L` |

These are fictional local accounts, not working email inboxes. You do not need to create an email account or verify an email. Each doctor sees requests assigned to that doctor's department. An empty dashboard is normal before you submit matching patient requests.

To switch departments, use **Se déconnecter / Log out** in the doctor interface, then log in using another row. A new browser tab normally shares the same doctor session; use logout to switch accounts.

The table applies to a fresh installation created from the committed test accounts. If an older `.local-data/dentists.json` was copied to the Mac, it retains its old passwords. There is no password-reset page. See [the account reference](dentist-test-accounts.md).

## 10. Confirm that everything works

1. Open the patient form at `http://127.0.0.1:3001/patient`.
2. Fill it with fictional information and submit a test request. See [the patient routing examples](patient-routing.md) if you want a request for a particular department.
3. On the confirmation page, save the private tracking link in a bookmark or note. The patient uses this link to see updates later.
4. Open the doctor login page and sign in using the account for the department shown on the submitted request.
5. Confirm the request appears in that department's dashboard, then open its reference.
6. Enter a fictional response in the evaluation form and save the decision.
7. Reopen or refresh the patient's private tracking link to see the update.

The app does not send real email or SMS notifications, make real calls, or book real appointments. A patient does not need a doctor account to submit a request.

## 11. Stop the website

1. Return to the Terminal window running the website.
2. Hold **Control** and press **C** once.
3. Wait for the `%` or `$` prompt to return. The website has stopped.

Closing the browser does not stop the server. Stopping the server does not erase saved local requests or doctor accounts.

## 12. Start it again tomorrow or after restarting the Mac

1. Open Terminal using **Command + Space**, type `Terminal`, and press Return.
2. Enter the project folder again:

```sh
cd ~/Downloads/USJ-TeleDent
```

If you used another location, use the folder-dragging method from step 5.

3. Start the website:

```sh
npm run dev -- --hostname 127.0.0.1
```

4. Leave Terminal open, then visit [http://127.0.0.1:3001](http://127.0.0.1:3001).

You do not need to reinstall Node.js, run `npm ci`, or recreate doctor accounts every day. If you download another project copy, install that copy's packages with `npm ci` inside its own folder.

## 13. Where your data is saved

Doctor accounts, sessions, patient requests, and photos are saved in a hidden folder called **.local-data** inside this project folder. In Finder, **Command + Shift + .** toggles hidden files if you need to see it.

- A fresh GitHub download does not include existing patient requests, photos, or doctor sessions.
- The Windows PC and MacBook have separate local data. Requests created on Windows do not appear automatically on the Mac, and vice versa.
- Keep the project folder if you want to keep its local test data. Deleting the folder also deletes the data inside it.
- If you back up fictional local data, stop the server first and include `.local-data`. Avoid copying Windows `node_modules` and `.next`; install packages on the Mac instead.
- The private tracking links work against the running installation containing their matching records. Keep those links private.

## 14. Troubleshooting

### Terminal says `command not found: node` or `command not found: npm`

Finish the Node.js installation, quit Terminal with **Command + Q**, reopen it, and repeat step 4. Opening only another tab may not refresh the environment after installation.

### Terminal says `No such file or directory` after `cd`

The folder path does not match your actual folder. Use the drag-and-drop method in step 5. Drag the extracted project folder, not the ZIP file or `package.json` itself.

### `npm ci` reports `ENOENT` or cannot find `package.json`

You are probably in the wrong folder. Run `ls` and confirm `package.json` and `package-lock.json` are listed. If not, repeat step 5. If the downloaded folder lacks these files, obtain the complete project ZIP again.

### Installation reports `EBADENGINE` or an unsupported Node version

Run `node --version`. Install the recommended Node.js version from step 2, reopen Terminal, enter the project folder again, and rerun `npm ci`.

### Installation fails because of the internet connection

Reconnect to the internet and rerun `npm ci` from the project folder. If the error mentions a blocked registry or certificate, check whether the network or managed Mac restricts npm downloads; ask its administrator if necessary. Do not disable certificate checks.

### Installation or account creation reports `EACCES` or permission denied

Keep the extracted project in a folder your Mac user can write to, such as Downloads. If macOS asks whether Terminal can access Downloads, allow that folder access. Do not add `sudo` to the project commands. If the error continues, save its exact text for troubleshooting.

### Port 3001 is already in use

First check whether another Terminal window is already running this project. If it is, use the existing website or stop that server with **Control + C**.

If another app needs port 3001, stop this project's current command with **Control + C**, then enter:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3002
```

Open [http://127.0.0.1:3002](http://127.0.0.1:3002). All patient and doctor URLs must now use `3002` instead of `3001`. For example, the doctor login becomes `http://127.0.0.1:3002/dentist/login`.

### The browser says it cannot connect

Confirm the server is still running in Terminal and has finished starting. Use `http://127.0.0.1:3001`, or port `3002` if you changed it. Closing Terminal, shutting down the Mac, or pressing Control + C stops the website. Start it again using step 12.

### Doctor login fails

Copy the email and password from the same table row, preserving uppercase/lowercase characters and punctuation. Check that you are using the website's doctor login page. Run `npm run dentists:seed` from a second Terminal window inside the project folder if accounts were never created. Existing accounts keep their existing passwords; the seed command does not reset them. Do not delete `.local-data` to fix a password problem because it also contains patient data.

### The doctor dashboard has no requests

A fresh installation has no patients. Submit a fictional patient request on this Mac, check its assigned department, and sign in as that department's doctor. Requests created on another computer are not synchronized. Also check that dashboard filters are set to show all requests.

### You see a different error

Copy the exact error text and note the command you ran and the output of `node --version`. Share those details with the person helping you. Leave out patient information and private tracking links.
