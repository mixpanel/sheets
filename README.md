# 🧮 sheets ⇔ mixpanel

connect your google sheet with mixpanel! no coding required!

[Install Now!](https://workspace.google.com/marketplace/app/sheets_%E2%87%94_mixpanel/1078767167468)

<div id="tldr"></div>

## 👔 tldr;

after [installing](https://workspace.google.com/marketplace/app/sheets_%E2%87%94_mixpanel/1078767167468) you will see the `sheets ⇔ mixpanel` dropdown under `extensions` in any google sheet. this module provides two modes, which are exposed in the main menu:

<img src="https://aktunes.neocities.org/sheets-mixpanel/two%20modes.png">

- [**Sheet → Mixpanel**](#mapping): import event/user/group/table data from the current sheet.
- [**Mixpanel → Sheet**](#export): export reports or cohort data from your mixpanel project


each UI has a simple user interface, and is essentially a form you fill out that contains the necessary details to carry out your desired result.


<div id="demo"></div>

## 🍿 demo

<a href="https://youtu.be/45ZBaJg-oe4" target="_blank"><img src="https://aktunes.neocities.org/sheets-mixpanel/youtube.png" alt="youtube demo"/></a>

<!-- <img src="https://aktunes.neocities.org/sheets-mixpanel/fastdemo.gif"> -->

<div id="mapping"></div>

## 🗺️ mappings (sheet → mixpanel)

sheet → mixpanel queries your **currently active sheet** to get your sheet's **column headers**.

once you choose the type of data you are importing, you will use the visual mapper to connect the **column headers** from your sheet to the **required fields** for the type of mixpanel data you are importing: 

<img src="https://aktunes.neocities.org/sheets-mixpanel/mappings.png">

as a brief summary of [the documentation](https://developer.mixpanel.com/docs/data-structure-deep-dive#anatomy-of-an-event) mixpanel's data model for events requires fields for:
- **event name** :  what to call each event in mixpanel
- **distinct_id** : the unique user identifier to whom the event is attributed
- **time** : a valid *date* or *time*; if the sheet recognizes your chosen column as a 'date' or time', it should work as intended
- **insert_id** : a value used to deduplicate records (optional) 

all other columns in your spreadsheet will get sent as **properties** (event, user, or group)

you'll also need to provide :
- [project id](https://help.mixpanel.com/hc/en-us/articles/115004490503-Project-Settings#project-id)
- [project token](https://help.mixpanel.com/hc/en-us/articles/115004490503-Project-Settings#project-token)
- [project region](https://help.mixpanel.com/hc/en-us/articles/360039135652-Data-Residency-in-EU#enabling-eu-residency)
- either: 
	- [service account](https://developer.mixpanel.com/reference/service-accounts) (admin or higher)
	OR
	- [API secret](https://help.mixpanel.com/hc/en-us/articles/115004490503-Project-Settings#api-secret)

note: since v1.12 **syncs** are **not supported** for events.

next, read about [runs + syncs](#sync)


<div id="export"></div>

## 💽 exports (mixpanel → sheet)
mixpanel → sheet queries your mixpanel project for a **report** or **cohort** and makes the results available in a new sheet.

note that this will be identical to the functionality would get when exporting a CSV file from the mixpanel UI:

<img src="https://aktunes.neocities.org/sheets-mixpanel/exportcsv.png">

there are a number of parameters needed to fetch a CSV from mixpanel; the simplest way to gather those parameters is to paste the URL of the report/cohort you wish to sync from your mixpanel project, and the app should find them:

<img src="https://aktunes.neocities.org/sheets-mixpanel/urlMapper.gif">

in case the URL does not contain all the values you need, the UI requires:
- a [service account](https://developer.mixpanel.com/reference/service-accounts) (consumer or higher) 
- a URL with either `mixpanel.com` or `eu.mixpanel.com` (to resolve data residency)
- [your project id](https://help.mixpanel.com/hc/en-us/articles/115004490503-Project-Settings#project-id)
- [your workspace id](https://developer.mixpanel.com/reference/query-api-authentication#:~:text=Projects%20with%20Data,a%20request%20parameter.)

- and either:
	- [your report id](https://developer.mixpanel.com/reference/insights-query#:~:text=The%20ID%20of%20your%20Insights%20report%20can%20be%20found%20from%20the%20url%3A%20https%3A//mixpanel.com/report/1/insights%23report/%3CYOUR_BOOKMARK_ID%3E/example%2Dreport) 
	OR 
	- [your cohort id](https://developer.mixpanel.com/reference/cohorts-list)

you can manually type these values in after pasting in a URL.

note: as of v1.12 **insights**, **funnels**, & **retention** are the only supported reports

next, read about [runs + syncs](#sync)


<div id="sync"></div>

## 🔄 runs + syncs

each UI has a similar user interface for you to input your details with **four** key actions at the bottom:

<img src="https://aktunes.neocities.org/sheets-mixpanel/run-buttons.png">

- **Run**: run the current configuration **once**; results are display in the UI
 - **Sync**: run the current configuration **every hour**; run receipts are stored in a log sheet
 - **Save**: store the current configuration
 - **Clear**: delete this sheet's sync and reload the UI

you may only have **one sync** active per sheet at a time.

if you are planning to sync data from your sheet to mixpanel, it is recommended that you do a "run" first.

once created, syncs will run on an hourly schedule; they can _also_ be manually triggered from the main menu by choosing **Sync Now!**:

<img src="https://aktunes.neocities.org/sheets-mixpanel/sync%20now.png">

note: since v1.12 **syncs** are **not supported** for events.



<div id="dev"></div>

## 👨‍🔧️ development

### local development

For local development, you will need to do the following:
- clone the repo: `git clone https://github.com/ak--47/sheets-mixpanel.git`

- install dev dependencies: `npm install`

- install [clasp](https://github.com/google/clasp) globally: `npm i g clasp`

- create a google sheet by importing the [provided test data](https://github.com/ak--47/sheets-mixpanel/blob/main/testData/full%20sandbox.xlsx)

- in the google sheets UI, go to Extensions → AppsScript → Project Settings to get your `scriptId`: 

<img src="https://aktunes.neocities.org/sheets-mixpanel/scriptId.png">

- using the `scriptId` create a `.clasp.json` file of the form:
```json
{
	"scriptId": "your-googleApps-script-id",
	"rootDir": "/path/to/this",
	"projectId": "your-gcp-project"
}
```
- run `clasp login`  to create a `.clasprc.json` file of the form:
```json
{
	"token": {
		"access_token": "",
		"scope": "",
		"token_type": "",
		"id_token": "",
		"expiry_date": ,
		"refresh_token": ""
	},
	"oauth2ClientSettings": {
		"clientId": "",
		"clientSecret": "",
		"redirectUri": "http://localhost"
	},
	"isLocalCreds": true
}
```
[see these docs](https://github.com/google/clasp#login) for more info

finally:

- use `npm run push` to push the module's code into your instance

- see `package.json` for other scripts; anything with a `watch` prefix will re-run on local code changes

### code overview

Here's an overview of the code in the repo:
```bash
├── Code.js				# routes + templates
├── README.md			# this file
├── appsscript.json		# extension manifest
├── components			# data in/out logic
│   ├── dataExport.js
│   └── dataImport.js
├── creds.json			# server-side credentials
├── env-sample.js		# where test credentials go
├── env.js
├── jsconfig.json		# typescript config
├── models				# models for data import
│   ├── modelEvents.js
│   ├── modelGroups.js
│   ├── modelTables.js
│   └── modelUsers.js
├── package-lock.json
├── package.json		# scripts + dependencies
├── testData			# test data
│   ├── events.csv
│   ├── full\ sandbox.xlsx 	# (use this one)
│   ├── groups.csv
│   ├── tables.csv
│   └── users.csv
├── tests				# local + server tests
│   ├── MockData.js
│   ├── UnitTestingApp.js
│   └── all.test.js
├── types				# jsdoc + typescript types
│   ├── Types.d.ts
│   └── Types.js
├── ui					# user interface
│   ├── mixpanel-to-sheet.html
│   └── sheet-to-mixpanel.html
└── utilities			
    ├── REPL.js			# a "quick and dirty" REPL for GAS
    ├── flush.js		# sending data to mixpanel
    ├── md5.js			# for $insert_id construction
    ├── misc.js			# various utilities
    ├── sheet.js		# for manipulating sheets
    ├── storage.js		# modifying storage configuration
    ├── toJson.js		# turn CSV to JSON
    ├── tracker.js		# usage tracking
    └── validate.js		# validation utils
```

### tests


you can run local tests with the `watch-test-local` script:

```
npm run watch-test-local
```

<img src="https://aktunes.neocities.org/sheets-mixpanel/local.png">


you can run server-side tests with the `test-server` script:

```
npm run test-server
```

in order for server-side tests to work, you will need to fill out params in a `env.js` file... there is [a sample (`env-sample.js`) committed to the repo](https://github.com/ak--47/sheets-mixpanel/blob/main/env-sample.js); this is what passing server-side tests look like (in the GCP console):

<img src="https://aktunes.neocities.org/sheets-mixpanel/tests.png"/>

<div id="limited"></div>

## 📝 limited use policy

Sheets™ ⇔ Mixpanel use and transfer to any other app of information received from Google APIs will adhere to [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes), including the Limited Use requirements. 

The app is free to use and does not contain ads, nor will any data collected by Sheets™ ⇔ Mixpanel be resold in any way. No human can read your spreadsheets; usage data is collected and anonymized only to improve the end-user's experience.

<div id="permissions"></div>


## 🔏 permissions

Using the principle of least-privilege, Sheets™ ⇔ Mixpanel requests access to three sensitive scopes to support application functionality, which are explained below:

- `https://www.googleapis.com/auth/script.container.ui`
is used to draw a dynamic UI which maps the columns headers of your currently active Google Sheet™ into dropdowns in the extension interface.

- `https://www.googleapis.com/auth/script.scriptapp`
is used to support scheduled hourly "sync" functionality so the pipeline you've configured in the UI can run automatically.

- `https://www.googleapis.com/auth/script.external_request`
is used to send your mapped data to mixpanel and to request your report/cohort data from mixpanel.

no other sensitive scopes are requested by the application.

<div id="motivation"></div>

## 💬 motivation

google sheets are databases. mixpanel is a database. it should be easy to make these things interoperable. now it is!

that's it for now. have fun!