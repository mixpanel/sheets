# 🧮 sheets ⇔ mixpanel

connect your google sheet with mixpanel! no coding required!


<div id="tldr"></div>

## 👔 tldr;

after installing you will see the `sheets ⇔ mixpanel` dropdown under `extensions` in any google sheet. this module provides two modes, which are exposed in the main menu:

<img src="https://aktunes.neocities.org/sheets-mixpanel/two%20modes.png">

- [**Sheet → Mixpanel**](#mapping): import event/user/group/table data from the current sheet.
- [**Mixpanel → Sheet**](#export): export reports or cohort data from your mixpanel project


each UI has a simple user interface, and is essentially a form you fill out that contains the necessary details to carry out your desired result.


<div id="demo"></div>

## 🍿 demo


<img src="https://aktunes.neocities.org/sheets-mixpanel/fastdemo.gif">

<div id="mapping"></div>

## 🗺️ mappings (sheet → mixpanel)

choose the type of data you are importing and then use the visual mapper to connect the events in your **currently active** spreadsheet to the **required fields** for the type of mixpanel data you are importing: 

<img src="https://aktunes.neocities.org/sheets-mixpanel/sheet-to-mixpanel.png">

all other columns in your spreadsheet will get sent as **properties** (event, user, or group)

finally, provide some project information and authentication details.


<div id="export"></div>

## 💽 exports (mixpanel → sheet)

provide authentication details along with a URL of a report or cohort from your mixpanel project that you wish to sync:
<img src="https://aktunes.neocities.org/sheets-mixpanel/mixpanel-to-sheet.png">

the UI will try to resolve all the relevant Ids; in case it cannot, you can add in your information to specify the particular report you want to sync

only **report** and **cohort** syncs are supported. currently, you can not sync flows reports.


<div id="sync"></div>

## 🔄 tests + syncs

each UI has a similar user interface for you to input your details with **four** key actions at the bottom:

<img src="https://aktunes.neocities.org/sheets-mixpanel/buttons.png">

 - **Sync**: run the current configuration **every hour**; run receipts are stored in a log sheet
 - **Test**: run the current configuration **once**; results are display in the UI
 - **Save**: store the current configuration
 - **Clear**: delete all syncs and delete the current configuration

you may only have **one sync** active per sheet at a time.



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

<div id="motivation"></div>

## 💬 motivation

google sheets are databases. mixpanel is a database. it should be easy to make these things interoperable. 

that's it for now. have fun!