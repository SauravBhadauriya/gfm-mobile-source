# Gully Fame Monorepo

The project uses Yarn Workspaces to run itself, all the apps are consolidated in the apps folder.

## Cloning this Repo

For Windows, due to how ninja handles folders, you can easily hit the 256 character limit for path length when building this project for deployment.
As a precaution, in a root directory like 'C:/', run these commands

```bash
mkdir gfm
cd gfm
git clone https://github.com/<your-username>/gullyfame .
```

This should guarantee no issues when building on a windows system. Linux/MacOS don't suffer from this in my knowledge.
You can also disable the 256 character path limit in the Windows Registry Editor or Settings following this [article](https://www.thewindowsclub.com/how-to-enable-or-disable-win32-long-paths-in-windows-11-10)

## Running the Project

First, you'll need Yarn. If you don't have it installed, just run this command.

```bash
npm install -g yarn
```

Then, in the root directory, run

```bash
yarn install
```

After yarn is done installing, you can run any one of the projects using these commands.

```bash
yarn workspace <project_name_in_package.json> <scripts_for_project_in_package.json>
```

## Project Structure

```text
gfm/
|
├──apps/
|   ├── gully-fame-admin # The Admin Panel to manage the app after release
|   ├── gully-fame-mobile # The Mobile App
|   ├── videoeditor # The Video Editor to edit reels
|
├── node_modules # Yarn will bundle any node_modules that would work in the root directory, other packages will be in each project's local           node_modules
├── .gitattributes # Enforces LF end-of-line to prevent hydration errors.
├── .gitignore
├── app.json
├── package.json # Root Package Json, enforces TypeScript
├── tsconfig.json
├── eas.json
```

## Mobile App Specific

Before starting up the Mobile project, create a .env file with this.

```bash
EXPO_PUBLIC_API_BASE_URL=http://103.194.228.68:3552/v1/api/
```

This will connect you to the API so the app will actually load.

## Final Notes

The new added plugin, withFFMPEGResolution.js is included in Mobile App and Video Editor app since the original ffmpeg-kit-react-native has been retired by the authors. The plugin injects some gradle code into /android/build.gradle so that the project connects to the community fork of ffmpeg-kit-community by salahawad
