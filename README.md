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

video todo... but for now:

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

todo code overview... but we have tests + type-safety!

<img src="https://aktunes.neocities.org/sheets-mixpanel/allTestPassing.png"/>

<div id="motivation"></div>

## 💬 motivation

sheets are databases. mixpanel is a database. it should be easy to make these things interoperable. 

that's it for now. have fun!