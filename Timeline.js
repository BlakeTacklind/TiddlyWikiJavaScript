/*\
Example:
<<TimeLineMacro>>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
This is the TimeLineMacro of Tiddly Wiki 5 written in JavaScript
It is used for creating the timeline of events in the world
*/

exports.name = "TimeLineMacro";

exports.params = [
	{name: "type"},
];

class EventObject{
	constructor(time_string, event_name, event_tag){
		this.time_obj = new TimeObject(time_string);
		this.event_name = event_name;
		this.event_tag = event_tag;
	}

	get_gt(){
		return this.time_obj.get_as_number("GT");
	}

	get_time(type){
		return this.time_obj.get_as_string(type)
	}

}

var YEAR_DAYS = 300;
var PCC_TO_GT = 55000;
var AC_TO_GT  = 50000;

function convert_to_gt(time_string){
	var date = time_string.split(" ");

	if(date.length > 2){
		return -1;
	}
	else if (date[1] == "GT"){
		var parsed_date = date[0].split("/")
		//YYYY
		if (parsed_date.length == 1){
				return parseInt(date[0]) * YEAR_DAYS;
		}
		//YYYY/DDD
		else if (parsed_date.length == 2){
				return parseInt(parsed_date[0]) * YEAR_DAYS + parseInt(parsed_date[1]);
		}
		//No months in God Time
		else if (parsed_date.length == 3){
				return -1;
		}
		else{
				return -1;
		}
	}
	else if (date.length == 1 || date[1] == "PCC"){
		var parsed_date = date[0].split("/")
		// format YYYY
		if (parsed_date.length == 1){
				return (parseInt(date[0]) + PCC_TO_GT) * YEAR_DAYS;
		}
		// format YYYY/DDD
		else if (parsed_date.length == 2){
				return parseInt(parsed_date[0] + PCC_TO_GT) * YEAR_DAYS + parseInt(parsed_date[1]);
		}
		// format YYYY/MM/DD
		else if (parsed_date.length == 3){
			//dont have months yet
			return -1;
			//return parseInt(parsed_date[0] + PCC_TO_GT) * YEAR_DAYS + parseInt(parsed_date[1]) * MONTH + parseInt(parsed_date[1]);
		}
		else{
				return -1;
		}
	}
	else if (date[1] == "AC"){
		var parsed_date = date[0].split("/")
		// format YYYY
		if (parsed_date.length == 1){
				return (parseInt(date[0]) + AC_TO_GT) * YEAR_DAYS;
		}
		// format YYYY/DDD
		else if (parsed_date.length == 2){
				return parseInt(parsed_date[0] + AC_TO_GT) * YEAR_DAYS + parseInt(parsed_date[1]);
		}
		// format YYYY/MM/DD
		else if (parsed_date.length == 3){
			//dont have months yet
			return -1;
			//return parseInt(parsed_date[0] + AC_TO_GT) * YEAR_DAYS + parseInt(parsed_date[1]);
		}
		else{
				return -1;
		}
	}
	else{
		return -1;
	}
}

class TimeObject{
	constructor(string){
		this.GT = convert_to_gt(string);
	}

	//Returns in days
	get_as_string(type){
		switch(type){
			case "PCC":
				return (this.get_as_number(type) / YEAR_DAYS).toString() +" "+ type;
			case "AC":
				return (this.get_as_number(type) / YEAR_DAYS).toString() +" "+ type;
			case "GT":
				return (this.get_as_number(type) / YEAR_DAYS).toString() +" "+ type;
			case "NOW":
				return (this.get_as_number(type) / YEAR_DAYS).toString() +" years ago";
			default:
				return "UNKNOWN TYPE ("+type+")";
		}

	}

	//Returns in days
	get_as_number(type){
		switch(type){
			case "PCC":
				return this.GT - PCC_TO_GT * YEAR_DAYS;
			case "AC":
				return this.GT - AC_TO_GT * YEAR_DAYS;
			case "GT":
				return this.GT;
			case "NOW":
				return CURRENT_TIME - this.GT;
			default:
				return 0;
		}
	}
}

function hasField(tiddler, field){
	return typeof tiddler.getFieldString(field) != "undefined" && tiddler.getFieldString(field) != "";
}

function compareTimeObjects(TO1, TO2){
	return TO1.get_gt() - TO2.get_gt();
}

function printTimeline(timeline, type){
	var output = ""
	for (var index in timeline){
		var eventObj = timeline[index];
		output += eventObj.get_time(type) + " [[" + eventObj.event_name + "|"+eventObj.event_tag+"]]<br>";
	}

	return output;
}

var CURRENT_TIME = null;

class Calendar{
	constructor(abbreviation, json_data){
		this.valid = false;

		//Get the calendars name
		if (json_data.name == undefined || json_data.name == "") {
			console.log("Calendar doesn't have a name, giving it the abbreviation "+abbreviation);
			this.name = abbreviation;
		}
		else {this.name = json_data.name};

		//Set up reference date
		if (json_data.ref != undefined && json_data.ref != ""){
			var split_date = json_data.ref.split(" ");

			this.ref_cal = split_date[1];
			this.ref_date = split_date[0];
		}
		else{
			//Only god time should not have a refrence point.
			if (abbreviation != "GT"){
				console.log("Calendar "+this.name +" doesn't have a start date");
				return;
			}

			this.ref_cal = "GT";
			this.ref_date = "0";
			this.reference = 0;
		}

		//get start date
		if (json_data.year_len == undefined || isNaN(json_data.year_len)){
			console.log("Calendar "+this.name+" doesn't have a number of days");
			return;
		}
		this.year_len = json_data.year_len;

		//Get month by month data
		if (json_data.n_months != json_data.months.length) {
			console.log("Calendar "+this.name+" doesn't have the right number of months");
			return;
		}
		this.months = new Array();
		var pos = 0;
		for (var i = 0; i < json_data.n_months; i++) {
			this.months.push({name:json_data.months[i], length:json_data.month_len[json_data.months[i]], position:pos});
			pos += json_data.month_len[json_data.months[i]];
		}
		if (pos != this.year_len){
			console.log("Calendar "+this.name+" has "+pos+" days worth of months and has "+this.year_len+" days in a year");
			return;
		}

		this.valid = true;
	}

	//Parse date like Y/M/D
	parseDate(date_string){
		if (this.reference == undefined){
			console.log("refrence not defined for "+this.name+" Calendar");
			return -1;
		}

		var date_split = date_string.split("/");

		var time_gt;
		switch(date_split.length){
			case 1:
				time_gt = parseInt(date_split[0]) * this.year_len + this.reference;
				 break;
			case 2:
				time_gt = parseInt(date_split[0] * this.year_len) + parseInt(date_split[1]);
				 break;
			case 3:
				time_gt = parseInt(date_split[0] * this.year_len) +
				 this.months[parseInt(date_split[1])].position +
				 parseInt(date_split[2]);
				 break;
			default:
				console.log("\""+date_string+"\" is a bad date parse for Calendar "+this.name);
				return -1;
		}

		if (isNaN(time_gt)){
			console.log("\""+date_string+"\" did not produce a number for Calendar "+this.name);
			return -1;
		}

		return time_gt;
	}

	get_string(god_time){

	}
}

var Calendar_List;

function GetInitalData(wiki){
	//Get the time of Now
	CURRENT_TIME = convert_to_gt(wiki.getTiddler("Now").fields.time);

	//Get calendar data
	const CALENDAR_START_STRING = "$:/Calendar/Custom/";

	//Parse all calendars in wiki
	Calendar_List = new Array();
	wiki.each(function(tiddler, title){
		if(title.startsWith(CALENDAR_START_STRING)){
			var json_obj = JSON.parse(tiddler.fields.text);

			var tmp = new Calendar(title.substring(CALENDAR_START_STRING.length), json_obj);

			if (tmp.valid){
				Calendar_List.push(tmp);
			}
			else{
				console.log("Bad Calendar");
			}
		}
	});


}

function GetEventObjects(wiki){

	var timeStampRegEx = /<<TimeStamp\s+"([^"]+)"\s+"([^"]+)"(?:\s+"[^"]+")?\s*>>/g;
	var eventObjects = new Array();

	wiki.each(function(tiddler, title){
		if (!title.startsWith("$")){
			if (hasField(tiddler, "time")){
				if (hasField(tiddler, "end")){
					eventObjects.push(new EventObject(tiddler.getFieldString("time"), "start of "+title, title));
					eventObjects.push(new EventObject(tiddler.getFieldString("end"), "end of "+title, title));
				}
				else{
					eventObjects.push(new EventObject(tiddler.getFieldString("time"), title, title));
				}
			}
			else if (hasField(tiddler, "end")){
				eventObjects.push(new EventObject(tiddler.getFieldString("end"), title, title));
			}


			if (hasField(tiddler, "born")){
				eventObjects.push(new EventObject(tiddler.getFieldString("born"), "Birth of "+title, title));
			}

			if (hasField(tiddler, "died")){
				eventObjects.push(new EventObject(tiddler.getFieldString("died"), "Death of "+title, title));
			}

			var text = tiddler.getFieldString("text");

			var match;
			while(match = timeStampRegEx.exec(text)){
				eventObjects.push(new EventObject(match[1], match[2], title));
			}
		}

	});

	return eventObjects;
}

/*
Run the macro
*/
exports.run = function(type) {
	//Satements for debug
	console.log(this.wiki);
	console.log(this.wiki.getTiddler("Now"));

	if (!type) type = "PCC"

	GetInitalData(this.wiki);

	var eventObjects = GetEventObjects(this.wiki);

	eventObjects = eventObjects.sort(compareTimeObjects);
	return printTimeline(eventObjects, type);
};

})();