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

/*
Run the macro
*/
exports.run = function(type) {
	if (!type) type = "PCC"
	var output = "";
	var timeStampRegEx = /<<TimeStamp\s+"([^"]+)"\s+"([^"]+)"(?:\s+"[^"]+")?\s*>>/g;
	var eventObjects = new Array();
	this.wiki.each(function(tiddler, title){
		if (title == "Now"){
			CURRENT_TIME = convert_to_gt(tiddler.getFieldString("time"))
		}

		if (!title.includes("$")){
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

	eventObjects = eventObjects.sort(compareTimeObjects);
	return printTimeline(eventObjects, type);
};

})();